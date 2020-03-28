Date.prototype.toDateInputValue = (function () {
    var local = new Date(this);
    local.setMinutes(this.getMinutes() - this.getTimezoneOffset());
    return local.toJSON().slice(0, 16);
});

function farenheitToCelsius(farenheit) {
    return Math.round(100 * ((farenheit - 32) * 5/9)) / 100
}

function celsiusToFarenheit(celsius) {
    return Math.round(100 * ((celsius * 9/5) + 32)) / 100
}

function readCookie(name) {
    let key = name + "=";
    let cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
        let cookie = cookies[i];
        while (cookie.charAt(0) === ' ') {
            cookie = cookie.substring(1, cookie.length);
        }
        if (cookie.indexOf(key) === 0) {
            return cookie.substring(key.length, cookie.length);
        }
    }
    return null;
}

var temperatureUnit = "f"
var chart

/*
UserContext
{
    unit: Farenheit|Celsius,
    dataPoints: [] <DataPoint>
}

DataPoint
{
    x: DateTime,
    y: floating point // Farenheit
}
*/

function getDataPoints() {
    var data = []
    var cookie = readCookie('data')
    if(cookie) {
        data = JSON.parse(cookie)
    }
    return data
}

function getTestDataPoints() {
    var data = []
    var i
    for (i = 20; i > 0; i--) {
        data.push({
            x: moment().add(-i, 'd'),
            y: 97.5 + Math.random() * 2 - 1
        })
    }
    return data
}

window.onload = function () {
    var chartContext = document.getElementById('chart').getContext('2d');
    chart = new Chart(chartContext, {
        type: 'line',
        data: {
            datasets: [{
                borderColor: '#55DD55',
                fill: false,
                showLine: false,
                data: getDataPoints()
            }]
        },
        options: {
            responsive: true,
            legend: {
                display: false
            },
            scales: {
                xAxes: [{
                    type: 'time'
                }],
                yAxes: [{
                    ticks: {
                        stepSize: 0.5
                    }
                }]
            }
        }
    })

    $('#fieldset-btn').on('click', function () {
        chart.data.datasets[0].data.push({
            x: moment($('#datetime').val()),
            y: Math.round(100 * $('#temperature').val()) / 100
        })
        chart.update()
        var expiration = moment().add(6, 'm')
        console.log(escape("data=" + JSON.stringify(chart.data.datasets[0].data) + ";expires=" + expiration + ";"))
        console.log(document.cookie)
        $('#fieldset').hide()
        $('#results').show()
    })

    $('#results-btn').on('click', function () {
        $('#results').hide()
        $('#fieldset').show()
    })

    $('#datetime').val(new Date().toDateInputValue())

    $('input[type=radio][name=inputTemperatureUnit]').change(function() {
        if (temperatureUnit == 'c' && this.value == 'f') {
            chart.data.datasets[0].data.forEach(function(e) { e.y = celsiusToFarenheit(e.y) })
            temperatureUnit = 'f'
            $('#displayFarenheit').prop('checked', true)
        }
        else if (temperatureUnit == 'f' && this.value == 'c') {
            chart.data.datasets[0].data.forEach(function(e) { e.y = farenheitToCelsius(e.y) })
            temperatureUnit = 'c'
            $('#displayCelsius').prop('checked', true)
        }
        chart.update()
    });

    $('input[type=radio][name=displayTemperatureUnit]').change(function() {
        if (temperatureUnit == 'c' && this.value == 'f') {
            chart.data.datasets[0].data.forEach(function(e) { e.y = celsiusToFarenheit(e.y) })
            temperatureUnit = 'f'
            $('#inputFarenheit').prop('checked', true)
        }
        else if (temperatureUnit == 'f' && this.value == 'c') {
            chart.data.datasets[0].data.forEach(function(e) { e.y = farenheitToCelsius(e.y) })
            temperatureUnit = 'c'
            $('#inputCelsius').prop('checked', true)
        }
        chart.update()
    });
}