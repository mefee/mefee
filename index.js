Date.prototype.toDateInputValue = (function () {
    var local = new Date(this);
    local.setMinutes(this.getMinutes() - this.getTimezoneOffset());
    return local.toJSON().slice(0, 16);
});

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
    // TODO get from source, currently randomly generated
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
    $('#fieldset-btn').on('click', function () {
        $('#fieldset').hide()
        $('#results').show()
    })

    $('#results-btn').on('click', function () {
        $('#results').hide()
        $('#fieldset').show()
    })

    $('#datetime').val(new Date().toDateInputValue())

    var chartContext = document.getElementById('chart').getContext('2d');
    var chart = new Chart(chartContext, {
        type: 'line',
        data: {
            datasets: [{
                borderColor: '#55DD55',
                fill: false,
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
                    type: 'time',
                    display: true
                }],
                yAxes: [{
                    display: true
                }]
            }
        }
    })
}