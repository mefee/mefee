"use strict";

/*global $, firebase, getSD, getMean, moment, chisqrdistr, window, document, Chart */
var temperatureUnit = "F";
var sick = false;
var chart;

Date.prototype.toDateInputValue = function () {
    var local = new Date(this);
    local.setMinutes(this.getMinutes() - this.getTimezoneOffset());
    return local.toJSON().slice(0, 16);
};

function farenheitToCelsius(farenheit) {
    return Math.round(100 * ((farenheit - 32) * 5 / 9)) / 100;
}

function celsiusToFarenheit(celsius) {
    return Math.round(100 * ((celsius * 9 / 5) + 32)) / 100;
}

function getSuperuser() {
    var superuser = null;
    window.location.search.split("&").forEach(function (query) {
        if (query.includes("superuser=")) {
            // This only works if firebase database rules let you! 
            superuser = query.substring(query.indexOf("superuser=") + "superuser=".length);
        }
    });
    return superuser;
}

function calculateBar(records) {
    var temperatures, result;
    try {
        if (records.length > 1) {
            temperatures = records.map(function (d) {
                return d.y;
            });
            result = 4 * getSD(temperatures) * Math.sqrt((records.length - 1) / chisqrdistr(records.length - 1, 0.95));
            return Math.min(result + getMean(temperatures), temperatureUnit === 'F' ? 100 : 37.8);
        }
        return temperatureUnit === 'F' ? 100 : 37.8;
    } catch (error) {
        console.error(error);
        return temperatureUnit === 'F' ? 100 : 37.8;
    }
}

function getEarliestDate(data) {
    return data.reduce(function (a, b) {
        return a.x < b.x ? a : b;
    }).x;
}

function getLatestDate(data) {
    return data.reduce(function (a, b) {
        return a.x > b.x ? a : b;
    }).x;
}

function persistRecords(records) {
    var i, copyToSave, user, superuser, record;
    if (records) {
        copyToSave = [];
        for (i = 0; i < records.length; i += 1) {
            record = records[i];
            copyToSave.push({
                datetime: record.x.toDate(),
                temperature: temperatureUnit === 'F' ? record.y : celsiusToFarenheit(record.y),
                status: record.status !== null ? record.status : 'healthy'
            });
        }
        console.log(copyToSave);

        user = firebase.auth().currentUser;
        superuser = getSuperuser();

        firebase.firestore().collection("users").doc(superuser !== null ? superuser : user.uid).set({
            schema_version: 1,
            email: user.email,
            preferred_temperature_unit: temperatureUnit,
            sick: sick,
            sync_time: moment().toDate(),
            data: copyToSave
        }).then(function () {
            console.log("Document successfully written!");
        }).catch(function (error) {
            console.error("Error writing document: ", error);
        });
    }
}

function dataChanged() {
    var data, length, filtered_data, filtered_length, bar;

    data = chart.data.datasets[0].data;

    data.sort(function (a, b) {
        return a.x - b.x;
    });

    length = data.length;
    filtered_data = chart.data.datasets[0].data.filter(function (d) {
        return moment().diff(d.x, 'days') > 0 && d.status !== 'sick';
    });
    filtered_length = filtered_data.length;

    if (length > 0) {
        bar = calculateBar(filtered_data);
        chart.data.datasets[1].data = [{
            x: getEarliestDate(data).clone().add(-1, 'days'),
            y: bar
        }, {
            x: getLatestDate(data).clone().add(1, 'days'),
            y: bar
        }];

        chart.update();
        $('#chart').show();
    } else {
        bar = temperatureUnit === 'F' ? 100 : 37.8;
    }

    if (filtered_length >= 5 && data[length - 1].y <= bar) {
        if (sick) {
            $('#feeling_better').show();
            $('#result_message').hide();
            data[length - 1].status = 'sick';
        } else {
            $('#result_message').show();
            $('#result_message').html("You seem fine today, please continue recording your temperature daily.");
            data[length - 1].status = 'healthy';
        }
    } else if (length > 0 && data[length - 1].y >= (temperatureUnit === 'F' ? 100 : 37.8)) {
        $('#feeling_better').hide();
        $('#result_message').show();
        $('#result_message').html("You are running a fever, please seek medical advice.");
        sick = true;
        data[length - 1].status = 'sick';
    } else if (filtered_length >= 5 && data[length - 1].y > bar) {
        $('#feeling_better').hide();
        $('#result_message').show();
        $('#result_message').html("Your temperature seems higher than normal, please <b>self-isolate</b> and continue to record your temperature daily.");
        sick = true;
        data[length - 1].status = 'sick';
    } else {
        $('#feeling_better').hide();
        $('#result_message').show();
        $('#result_message').html("We have insufficient data so far to make a recommendation. Please continue to record your temperature daily.");
        if (length > 0) {
            data[length - 1].status = 'healthy';
        }
    }

    $('#data-table').html(chart.data.datasets[0].data.map(function (it, index) {
        return "<tr><td>" +
            moment(it.x).format("YYYY-MM-DD  HH:mm") + "</td><td>" +
            (Math.round(it.y * 100) / 100) + " " + temperatureUnit +
            "</td><td><select id='status_" + index + "' onchange='change_status(" + index + ")' style='cursor: pointer;'>" +
            "<option value='healthy' " + (it.status === 'sick' ? "" : "selected") + ">Healthy</option>" +
            "<option value='sick' " + (it.status === 'sick' ? "selected" : "") + ">Sick</option>" +
            "</select></td><td><a style='cursor: pointer;' onclick='deleteData(" + index + ")'>Delete</a></td></tr>";
    }).join("\n"));
}

function not_sick() {
    sick = false;
    dataChanged();
    persistRecords(chart.data.datasets[0].data);
    $('#feeling_better').hide();
}

function change_status(index) {
    chart.data.datasets[0].data[index].status = $('#status_' + index).val();
    dataChanged();
    persistRecords(chart.data.datasets[0].data);
}

function deleteData(index) {
    chart.data.datasets[0].data.splice(index, 1);
    persistRecords(chart.data.datasets[0].data);
    dataChanged();
    persistRecords(chart.data.datasets[0].data);
}

function login() {
    var provider = new firebase.auth.GoogleAuthProvider();
    firebase.auth().signInWithRedirect(provider);
}

function logout() {
    firebase.auth().signOut().then(function () {
        window.location.reload();
    }).catch(function (error) {
        console.error(error);
    });
}

function setTemperatureUnit(unit) {
    if (temperatureUnit === 'C' && unit === 'F') {
        chart.data.datasets[0].data.forEach(function (e) {
            e.y = celsiusToFarenheit(e.y);
        });
        temperatureUnit = 'F';
        $("#temperature-unit").html('F');
        $("#farenheit").attr("checked", true);
        $("#celsius").attr("checked", false);
    } else if (temperatureUnit === 'F' && unit === 'C') {
        chart.data.datasets[0].data.forEach(function (e) {
            e.y = farenheitToCelsius(e.y);
        });
        temperatureUnit = 'C';
        $("#temperature-unit").html('C');
        $("#farenheit").attr("checked", false);
        $("#celsius").attr("checked", true);
    }
}

function setRecords(records) {
    chart.data.datasets[0].data = records;
    dataChanged();
    $('#loading').hide();
    $('#login_page').hide();
    $('#content_page').show();
}

function loadData() {
    var user, superuser, i, record, records, data;

    user = firebase.auth().currentUser;
    superuser = getSuperuser();

    firebase.firestore().collection("users").doc(superuser !== null ? superuser : user.uid).get().then(function (doc) {
        if (doc.exists) {
            data = doc.data();
            console.log("Document data:", data);
            if (data.preferred_temperature_unit) {
                setTemperatureUnit(data.preferred_temperature_unit);
                $('#temperature').val(temperatureUnit === 'F' ? 98.6 : 37);
            }
            if (data.sick) {
                sick = true;
            }
            records = [];
            for (i = 0; i < data.data.length; i += 1) {
                record = data.data[i];
                records.push({
                    x: moment.unix(record.datetime.seconds),
                    y: temperatureUnit === 'F' ? record.temperature : farenheitToCelsius(record.temperature),
                    status: record.status !== null ? record.status : 'healthy'
                });
            }
            setRecords(records);
        } else {
            console.log("No data found");
            setRecords([]);
        }
    }).catch(function (error) {
        console.log("Error getting document:", error);
    });
    return [];
}

function showFormTab() {
    $('#tab_button_results').removeClass('selected');
    $('#tab_button_about').removeClass('selected');
    $('#tab_button_form').addClass('selected');
    $('#tab_results').hide();
    $('#tab_about').hide();
    $('#tab_form').show();
}

function showResultsTab() {
    $('#tab_button_form').removeClass('selected');
    $('#tab_button_about').removeClass('selected');
    $('#tab_button_results').addClass('selected');
    $('#tab_form').hide();
    $('#tab_about').hide();
    $('#tab_results').show();
}

function showAboutTab() {
    $('#tab_button_form').removeClass('selected');
    $('#tab_button_results').removeClass('selected');
    $('#tab_button_about').addClass('selected');
    $('#tab_form').hide();
    $('#tab_results').hide();
    $('#tab_about').show();
}

function addNewRecord() {
    var newRecord = {
        x: moment($('#datetime').val()),
        y: Math.round(100 * $('#temperature').val()) / 100,
        status: 'healthy'
    };

    chart.data.datasets[0].data.push(newRecord);
    dataChanged();
    persistRecords(chart.data.datasets[0].data);

    showResultsTab();
    $('#datetime').val(new Date().toDateInputValue());
}

function main() {
    $('#datetime').val(new Date().toDateInputValue());

    $('input[type=radio][name=temperatureUnit]').change(function () {
        setTemperatureUnit(this.value);
        dataChanged();
    });

    chart = new Chart(document.getElementById('chart').getContext('2d'), {
        type: 'line',
        data: {
            datasets: [{
                showLine: false,
                pointRadius: 5,
                pointBackgroundColor: '#55DD55',
                data: []
            }, {
                borderColor: '#FF0000',
                fill: false,
                showLine: true,
                pointRadius: 0,
                data: []
            }]
        },
        options: {
            responsive: true,
            tooltips: {
                enabled: false
            },
            legend: {
                display: false
            },
            scales: {
                xAxes: [{
                    type: 'time',
                    time: {
                        unit: 'day'
                    },
                    gridLines: {
                        color: "#555555"
                    },
                    ticks: {
                        fontColor: "#999999",
                        fontSize: 18
                    }
                }],
                yAxes: [{
                    gridLines: {
                        color: "#555555"
                    },
                    ticks: {
                        stepSize: 0.5,
                        fontColor: "#999999",
                        fontSize: 18
                    }
                }]
            }
        }
    });

    loadData();
}

window.onload = function () {
    var firebaseConfig = {
        apiKey: "AIzaSyDLowILuyzRrK9OLY9Ie_rgjI8dIVsL6hM",
        authDomain: "mefee-59275.firebaseapp.com",
        databaseURL: "https://mefee-59275.firebaseio.com",
        projectId: "mefee-59275",
        storageBucket: "mefee-59275.appspot.com",
        messagingSenderId: "582992738780",
        appId: "1:582992738780:web:93ed924ec5e8145378f719",
        measurementId: "G-R3TWMZ9F97"
    };

    firebase.initializeApp(firebaseConfig);
    firebase.analytics();

    firebase.auth().getRedirectResult().then(function () {
        var user = firebase.auth().currentUser;
        if (!user) {
            $('#loading').hide();
            $('#content_page').hide();
            $('#login_page').show();
        } else {
            $('#loading').show();
            $('#login_page').hide();
            $('#content_page').hide();

            $('#username').html(user.email);
            $('#user_info_bar').show();
            main();
        }
    }).catch(function (error) {
        console.error(error);
    });
};
