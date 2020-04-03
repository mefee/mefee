"use strict";

/*global $, firebase, getSD, getMean, moment, chisqrdistr, window, document, Chart */
var temperatureUnit = "F";
var currentProfile = {
    name: 'Default',
    sick: false,
    records: []
};
var profiles = [currentProfile];
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
    if (records.length > 1) {
        temperatures = records.map(function (d) {
            return d.y;
        });
        result = 3 * getSD(temperatures) * Math.sqrt((records.length - 1) / chisqrdistr(records.length - 1, 0.95));

        return Math.min(result + getMean(temperatures), temperatureUnit === 'F' ? 100 : 37.8);
    }
    return 100;
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

function renderProfiles() {
    $('#profile_selector').html(profiles.map(function (profile) {
        return "<option value='" + profile.name + "'>" + profile.name + "</option>";
    }).join("\n"));
}

function persistData() {
    var user, superuser;    

    user = firebase.auth().currentUser;
    superuser = getSuperuser();

    firebase.firestore().collection("users").doc(superuser !== null ? superuser : user.uid).set({
        schema_version: 2,
        email: user.email,
        preferred_temperature_unit: temperatureUnit,
        sync_time: moment().toDate(),
        profiles: profiles
    }).then(function () {
        console.log("Document successfully written!");
    }).catch(function (error) {
        console.error("Error writing document: ", error);
    });
}

function redraw() {
    var data, length, filtered_data, filtered_length, bar, index, string;

    data = chart.data.datasets[0].data;
   
    length = data.length;
    filtered_data = data.filter(function (record) {
        return moment().diff(record.x, 'days') > 0 && !record.sick;
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
        bar = 100;
    }

    if (filtered_length >= 5 && data[length - 1].y <= bar) {
        if (currentProfile.sick) {
            $('#feeling_better').show();
            $('#result_message').hide();
            data[length - 1].sick = true;
        } else {
            $('#result_message').show();
            $('#result_message').html("You seem fine today, please continue recording your temperature daily.");
            data[length - 1].sick = false;
        }
    } else if (length > 0 && data[length - 1].y >= 100) {
        $('#feeling_better').hide();
        $('#result_message').show();
        $('#result_message').html("You are running a fever, please seek medical advice.");
        currentProfile.sick = true;
        data[length - 1].sick = true;
    } else if (filtered_length >= 5 && data[length - 1].y > bar) {
        $('#feeling_better').hide();
        $('#result_message').show();
        $('#result_message').html("Your temperature seems higher than normal, please <b>self-isolate</b> and continue to record your temperature daily.");
        currentProfile.sick = true;
        data[length - 1].sick = true;
    } else {
        $('#feeling_better').hide();
        $('#result_message').show();
        $('#result_message').html("We have insufficient data so far to make a recommendation. Please continue to record your temperature daily.");
        if (length > 0) {
            data[length - 1].sick = false;
        }
    }

    data = data.sort(function (a, b) {
        return b.x.toDate() - a.x.toDate();
    });

    $('#data-table').html(data.map(function(record, index) {
        return "<tr><td>" +
        record.x.format("YYYY-MM-DD  HH:mm") + "</td><td>" +
        record.y + " " + temperatureUnit +
        "</td><td><select id='status_" + index + "' onchange='changeStatus(" + index + ")' style='cursor: pointer;'>" +
        "<option value='healthy' " + (record.sick ? "" : "selected") + ">Healthy</option>" +
        "<option value='sick' " + (record.sick ? "selected" : "") + ">Sick</option>" +
        "</select></td><td><a style='cursor: pointer;' onclick='deleteData(" + index + ")'>Delete</a></td></tr>";
    }).join("\n"));
}

function renderRecords() {
    chart.data.datasets[0].data = currentProfile.records.map(function (record) {
        return {
            x: moment.unix(record.datetime.seconds),
            y: temperatureUnit === 'F' ? record.temperature : farenheitToCelsius(record.temperature),
            sick: record.sick
        };
    });

    redraw();
    $('#loading').hide();
    $('#login_page').hide();
    $('#content_page').show();
}

function notSick() {
    currentProfile.sick = false;
    persistData();
    $('#feeling_better').hide();
    renderRecords();
}

function changeStatus(index) {
    currentProfile.records[index].sick = $('#status_' + index).val() === 'sick';
    persistData();
    renderRecords();
}

function deleteData(index) {
    currentProfile.records.splice(index, 1);
    persistData();
    renderRecords();
}

function renameProfile() {
    var name, matches;

    name = $('#existing_profile_name').val();

    matches = profiles.filter(function (profile) {
        return profile.name === name;
    });

    if (matches.length === 0) {
        currentProfile.name = name;
        renderProfiles();
        setCurrentProfile(currentProfile);
    }

    persistData();

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
        temperatureUnit = 'F';
        $("#temperature-unit").html('F');
        $("#farenheit").attr("checked", true);
        $("#celsius").attr("checked", false);
    } else if (temperatureUnit === 'F' && unit === 'C') {
        temperatureUnit = 'C';
        $("#temperature-unit").html('C');
        $("#farenheit").attr("checked", false);
        $("#celsius").attr("checked", true);
    }

    $('#temperature').val(temperatureUnit === 'F' ? 97.9 : 36.6);
    renderRecords();
}

function setCurrentProfile(profile) {
    console.log("Setting current profile", profile);
    $('#profile_selector').val(profile.name);
    $('#current_profile_name').html(profile.name);
    $('#existing_profile_name').val(profile.name);
    currentProfile = profile;
    renderRecords();
}

function loadDataV2(data) {
    if (data.profiles !== null && data.profiles.length >= 1) {
        profiles = data.profiles;
        if (!profiles || profiles.length === 0) {
            profiles = [{
                name: 'Default',
                sick: false,
                records: []
            }];
        }
    } else {
        profiles = [{
            name: 'Default',
            sick: false,
            records: []
        }];
    }

    setTemperatureUnit(data.preferred_temperature_unit);
    renderProfiles();
    setCurrentProfile(profiles[0]);
}

function loadDataV1(dataV1) {
    var i, records, record, dataV2;

    dataV2 = {
        preferred_temperature_unit: (dataV1.preferred_temperature_unit !== null) ? dataV1.preferred_temperature_unit : 'F',
        profiles: [{
            name: 'Default',
            sick: (dataV1.sick !== null && dataV1.sick !== undefined) ? dataV1.sick : false,
            records: []
        }]
    };

    records = [];
    for (i = 0; i < dataV1.data.length; i += 1) {
        record = dataV1.data[i];
        records.push({
            datetime: record.datetime,
            temperature: record.temperature,
            sick: record.status === 'sick' ? true : false
        });
    }

    dataV2.profiles[0].records = records;

    loadDataV2(dataV2);
}

function loadData() {
    var user, superuser, data;

    user = firebase.auth().currentUser;
    superuser = getSuperuser();

    firebase.firestore().collection("users").doc(superuser !== null ? superuser : user.uid).get().then(function (doc) {
        if (doc.exists) {
            data = doc.data();
            console.log("Document data:", data);
            if (data.schema_version === 2) {
                loadDataV2(data);
            } else {
                loadDataV1(data);
            }
        } else {
            loadDataV1({
                sick: false,
                data: []
            });
            console.log("No data found");
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
    var input = $('#temperature').val();
    var newRecord = {
        datetime: firebase.firestore.Timestamp.fromDate(moment($('#datetime').val()).toDate()),
        temperature: Math.round(100 * (temperatureUnit == 'F' ? Math.round(input) : celsiusToFarenheit(input))) / 100,
        sick: false
    };

    currentProfile.records.push(newRecord);
    persistData();
    renderRecords();

    showResultsTab();
    $('#datetime').val(new Date().toDateInputValue());
}

function changeProfile() {
    var selectedProfile, matches;
    selectedProfile = $('#profile_selector').val();
    matches = profiles.filter(function (profile) {
        return profile.name === selectedProfile;
    });
    setCurrentProfile(matches[0]);
}

function addProfile() {
    var newProfile, matches;
    newProfile = {
        name: $('#new_profile_name').val(),
        sick: false,
        records: []
    };

    matches = profiles.filter(function (profile) {
        return profile.name === newProfile.name;
    });

    if (matches.length === 0) {
        $('#new_profile_name').val('');
        profiles.push(newProfile);
        renderProfiles();
        $('#profile_selector').val(newProfile.name);
        setCurrentProfile(newProfile);
    }

    persistData();
}

function main() {
    $('#datetime').val(new Date().toDateInputValue());

    $('input[type=radio][name=temperatureUnit]').change(function () {
        setTemperatureUnit(this.value);
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
