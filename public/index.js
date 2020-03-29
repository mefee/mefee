var SIGNIFICANT = 5;

function chisqrdistr(n, p) {
	if (n <= 0 || Math.abs(n) - Math.abs(integer(n)) != 0) {
		throw ("Invalid n: " + n + "\n");
	}
	if (p <= 0 || p > 1) {
		throw ("Invalid p: " + p + "\n");
	}
	return precision_string(_subchisqr(n - 0, p - 0));
}

function udistr(p) {
	if (p > 1 || p <= 0) {
		throw ("Invalid p: p\n");
	}
	return precision_string(_subu(p - 0));
}

function tdistr(n, p) {
	if (n <= 0 || Math.abs(n) - Math.abs(integer(n)) != 0) {
		throw ("Invalid n: n\n");
	}
	if (p <= 0 || p >= 1) {
		throw ("Invalid p: p\n");
	}
	return precision_string(_subt(n - 0, p - 0));
}

function fdistr(n, m, p) {
	if ((n <= 0) || ((Math.abs(n) - (Math.abs(integer(n)))) != 0)) {
		throw ("Invalid n: n\n");
	}
	if ((m <= 0) || ((Math.abs(m) - (Math.abs(integer(m)))) != 0)) {
		throw ("Invalid m: m\n");
	}
	if ((p <= 0) || (p > 1)) {
		throw ("Invalid p: p\n");
	}
	return precision_string(_subf(n - 0, m - 0, p - 0));
}

function uprob(x) {
	return precision_string(_subuprob(x - 0));
}

function chisqrprob(n, x) {
	if ((n <= 0) || ((Math.abs(n) - (Math.abs(integer(n)))) != 0)) {
		throw ("Invalid n: n\n");
	}
	return precision_string(_subchisqrprob(n - 0, x - 0));
}

function tprob(n, x) {
	if ((n <= 0) || ((Math.abs(n) - Math.abs(integer(n))) != 0)) {
		throw ("Invalid n: n\n");
	}
	return precision_string(_subtprob(n - 0, x - 0));
}

function fprob(n, m, x) {
	if ((n <= 0) || ((Math.abs(n) - (Math.abs(integer(n)))) != 0)) {
		throw ("Invalid n: n\n"); /* first degree of freedom */
	}
	if ((m <= 0) || ((Math.abs(m) - (Math.abs(integer(m)))) != 0)) {
		throw ("Invalid m: m\n"); /* second degree of freedom */
	}
	return precision_string(_subfprob(n - 0, m - 0, x - 0));
}


function _subfprob(n, m, x) {
	var p;

	if (x <= 0) {
		p = 1;
	} else if (m % 2 == 0) {
		var z = m / (m + n * x);
		var a = 1;
		for (var i = m - 2; i >= 2; i -= 2) {
			a = 1 + (n + i - 2) / i * z * a;
		}
		p = 1 - Math.pow((1 - z), (n / 2) * a);
	} else if (n % 2 == 0) {
		var z = n * x / (m + n * x);
		var a = 1;
		for (var i = n - 2; i >= 2; i -= 2) {
			a = 1 + (m + i - 2) / i * z * a;
		}
		p = Math.pow((1 - z), (m / 2)) * a;
	} else {
		var y = Math.atan2(Math.sqrt(n * x / m), 1);
		var z = Math.pow(Math.sin(y), 2);
		var a = (n == 1) ? 0 : 1;
		for (var i = n - 2; i >= 3; i -= 2) {
			a = 1 + (m + i - 2) / i * z * a;
		}
		var b = Math.PI;
		for (var i = 2; i <= m - 1; i += 2) {
			b *= (i - 1) / i;
		}
		var p1 = 2 / b * Math.sin(y) * Math.pow(Math.cos(y), m) * a;

		z = Math.pow(Math.cos(y), 2);
		a = (m == 1) ? 0 : 1;
		for (var i = m - 2; i >= 3; i -= 2) {
			a = 1 + (i - 1) / i * z * a;
		}
		p = max(0, p1 + 1 - 2 * y / Math.PI
			- 2 / Math.PI * Math.sin(y) * Math.cos(y) * a);
	}
	return p;
}


function _subchisqrprob(n, x) {
	var p;

	if (x <= 0) {
		p = 1;
	} else if (n > 100) {
		p = _subuprob((Math.pow((x / n), 1 / 3)
			- (1 - 2 / 9 / n)) / Math.sqrt(2 / 9 / n));
	} else if (x > 400) {
		p = 0;
	} else {
		var a;
		var i;
		var i1;
		if ((n % 2) != 0) {
			p = 2 * _subuprob(Math.sqrt(x));
			a = Math.sqrt(2 / Math.PI) * Math.exp(-x / 2) / Math.sqrt(x);
			i1 = 1;
		} else {
			p = a = Math.exp(-x / 2);
			i1 = 2;
		}

		for (i = i1; i <= (n - 2); i += 2) {
			a *= x / i;
			p += a;
		}
	}
	return p;
}

function _subu(p) {
	var y = -Math.log(4 * p * (1 - p));
	var x = Math.sqrt(
		y * (1.570796288
			+ y * (.03706987906
				+ y * (-.8364353589E-3
					+ y * (-.2250947176E-3
						+ y * (.6841218299E-5
							+ y * (0.5824238515E-5
								+ y * (-.104527497E-5
									+ y * (.8360937017E-7
										+ y * (-.3231081277E-8
											+ y * (.3657763036E-10
												+ y * .6936233982E-12)))))))))));
	if (p > .5)
		x = -x;
	return x;
}

function _subuprob(x) {
	var p = 0; /* if (absx > 100) */
	var absx = Math.abs(x);

	if (absx < 1.9) {
		p = Math.pow((1 +
			absx * (.049867347
				+ absx * (.0211410061
					+ absx * (.0032776263
						+ absx * (.0000380036
							+ absx * (.0000488906
								+ absx * .000005383)))))), -16) / 2;
	} else if (absx <= 100) {
		for (var i = 18; i >= 1; i--) {
			p = i / (absx + p);
		}
		p = Math.exp(-.5 * absx * absx) / Math.sqrt(2 * Math.PI) / (absx + p);
	}

	if (x < 0)
		p = 1 - p;
	return p;
}


function _subt(n, p) {

	if (p >= 1 || p <= 0) {
		throw ("Invalid p: p\n");
	}

	if (p == 0.5) {
		return 0;
	} else if (p < 0.5) {
		return - _subt(n, 1 - p);
	}

	var u = _subu(p);
	var u2 = Math.pow(u, 2);

	var a = (u2 + 1) / 4;
	var b = ((5 * u2 + 16) * u2 + 3) / 96;
	var c = (((3 * u2 + 19) * u2 + 17) * u2 - 15) / 384;
	var d = ((((79 * u2 + 776) * u2 + 1482) * u2 - 1920) * u2 - 945)
		/ 92160;
	var e = (((((27 * u2 + 339) * u2 + 930) * u2 - 1782) * u2 - 765) * u2
		+ 17955) / 368640;

	var x = u * (1 + (a + (b + (c + (d + e / n) / n) / n) / n) / n);

	if (n <= Math.pow(log10(p), 2) + 3) {
		var round;
		do {
			var p1 = _subtprob(n, x);
			var n1 = n + 1;
			var delta = (p1 - p) / Math.exp((n1 * Math.log(n1 / (n + x * x))
				+ Math.log(n / n1 / 2 / Math.PI) - 1
				+ (1 / n1 - 1 / n) / 6) / 2);
			x += delta;
			round = round_to_precision(delta, Math.abs(integer(log10(Math.abs(x)) - 4)));
		} while ((x) && (round != 0));
	}
	return x;
}

function _subtprob(n, x) {

	var a;
	var b;
	var w = Math.atan2(x / Math.sqrt(n), 1);
	var z = Math.pow(Math.cos(w), 2);
	var y = 1;

	for (var i = n - 2; i >= 2; i -= 2) {
		y = 1 + (i - 1) / i * z * y;
	}

	if (n % 2 == 0) {
		a = Math.sin(w) / 2;
		b = .5;
	} else {
		a = (n == 1) ? 0 : Math.sin(w) * Math.cos(w) / Math.PI;
		b = .5 + w / Math.PI;
	}
	return max(0, 1 - b - a * y);
}

function _subf(n, m, p) {
	var x;

	if (p >= 1 || p <= 0) {
		throw ("Invalid p: p\n");
	}

	if (p == 1) {
		x = 0;
	} else if (m == 1) {
		x = 1 / Math.pow(_subt(n, 0.5 - p / 2), 2);
	} else if (n == 1) {
		x = Math.pow(_subt(m, p / 2), 2);
	} else if (m == 2) {
		var u = _subchisqr(m, 1 - p);
		var a = m - 2;
		x = 1 / (u / m * (1 +
			((u - a) / 2 +
				(((4 * u - 11 * a) * u + a * (7 * m - 10)) / 24 +
					(((2 * u - 10 * a) * u + a * (17 * m - 26)) * u
						- a * a * (9 * m - 6)
					) / 48 / n
				) / n
			) / n));
	} else if (n > m) {
		x = 1 / _subf2(m, n, 1 - p)
	} else {
		x = _subf2(n, m, p)
	}
	return x;
}

function _subf2(n, m, p) {
	var u = _subchisqr(n, p);
	var n2 = n - 2;
	var x = u / n *
		(1 +
			((u - n2) / 2 +
				(((4 * u - 11 * n2) * u + n2 * (7 * n - 10)) / 24 +
					(((2 * u - 10 * n2) * u + n2 * (17 * n - 26)) * u
						- n2 * n2 * (9 * n - 6)) / 48 / m) / m) / m);
	var delta;
	do {
		var z = Math.exp(
			((n + m) * Math.log((n + m) / (n * x + m))
				+ (n - 2) * Math.log(x)
				+ Math.log(n * m / (n + m))
				- Math.log(4 * Math.PI)
				- (1 / n + 1 / m - 1 / (n + m)) / 6
			) / 2);
		delta = (_subfprob(n, m, x) - p) / z;
		x += delta;
	} while (Math.abs(delta) > 3e-4);
	return x;
}

function _subchisqr(n, p) {
	var x;

	if ((p > 1) || (p <= 0)) {
		throw ("Invalid p: p\n");
	} else if (p == 1) {
		x = 0;
	} else if (n == 1) {
		x = Math.pow(_subu(p / 2), 2);
	} else if (n == 2) {
		x = -2 * Math.log(p);
	} else {
		var u = _subu(p);
		var u2 = u * u;

		x = max(0, n + Math.sqrt(2 * n) * u
			+ 2 / 3 * (u2 - 1)
			+ u * (u2 - 7) / 9 / Math.sqrt(2 * n)
			- 2 / 405 / n * (u2 * (3 * u2 + 7) - 16));

		if (n <= 100) {
			var x0;
			var p1;
			var z;
			do {
				x0 = x;
				if (x < 0) {
					p1 = 1;
				} else if (n > 100) {
					p1 = _subuprob((Math.pow((x / n), (1 / 3)) - (1 - 2 / 9 / n))
						/ Math.sqrt(2 / 9 / n));
				} else if (x > 400) {
					p1 = 0;
				} else {
					var i0
					var a;
					if ((n % 2) != 0) {
						p1 = 2 * _subuprob(Math.sqrt(x));
						a = Math.sqrt(2 / Math.PI) * Math.exp(-x / 2) / Math.sqrt(x);
						i0 = 1;
					} else {
						p1 = a = Math.exp(-x / 2);
						i0 = 2;
					}

					for (var i = i0; i <= n - 2; i += 2) {
						a *= x / i;
						p1 += a;
					}
				}
				z = Math.exp(((n - 1) * Math.log(x / n) - Math.log(4 * Math.PI * x)
					+ n - x - 1 / n / 6) / 2);
				x += (p1 - p) / z;
				x = round_to_precision(x, 5);
			} while ((n < 31) && (Math.abs(x0 - x) > 1e-4));
		}
	}
	return x;
}

function log10(n) {
	return Math.log(n) / Math.log(10);
}

function max() {
	var max = arguments[0];
	for (var i = 0; i < arguments.length; i++) {
		if (max < arguments[i])
			max = arguments[i];
	}
	return max;
}

function min() {
	var min = arguments[0];
	for (var i = 0; i < arguments.length; i++) {
		if (min > arguments[i])
			min = arguments[i];
	}
	return min;
}

function precision(x) {
	return Math.abs(integer(log10(Math.abs(x)) - SIGNIFICANT));
}

function precision_string(x) {
	if (x) {
		return round_to_precision(x, precision(x));
	} else {
		return "0";
	}
}

function round_to_precision(x, p) {
	x = x * Math.pow(10, p);
	x = Math.round(x);
	return x / Math.pow(10, p);
}

function integer(i) {
	if (i > 0)
		return Math.floor(i);
	else
		return Math.ceil(i);
}


Date.prototype.toDateInputValue = (function () {
	var local = new Date(this);
	local.setMinutes(this.getMinutes() - this.getTimezoneOffset());
	return local.toJSON().slice(0, 16);
});

function farenheitToCelsius(farenheit) {
	return Math.round(100 * ((farenheit - 32) * 5 / 9)) / 100
}

function celsiusToFarenheit(celsius) {
	return Math.round(100 * ((celsius * 9 / 5) + 32)) / 100
}

function readCookie(name) {
	let key = name + "=";
	let cookies = document.cookie.split(';');
	for (let i = 0; i < cookies.length; i++) {
		let cookie = unescape(cookies[i]);
		while (cookie.charAt(0) === ' ') {
			cookie = cookie.substring(1, cookie.length);
		}
		if (cookie.indexOf(key) === 0) {
			return cookie.substring(key.length, cookie.length);
		}
	}
	return null;
}

// Arithmetic mean
function getMean(data) {
	return data.reduce(function (a, b) {
		return Number(a) + Number(b)
	}) / data.length;
}

// Standard deviation
function getSD(data) {
	let m = getMean(data);
	return Math.sqrt(data.reduce(function (sq, n) {
		return sq + Math.pow(n - m, 2)
	}, 0) / (data.length - 1))
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
	if (cookie) {
		data = JSON.parse(cookie)
	}
	return data
}

function getTestDataPoints() {
	return [
		{ x: moment("2020-03-22T22:30:00"), y: 97.4 },
		{ x: moment("2020-03-22T19:00:00"), y: 97.4 },
		{ x: moment("2020-03-23T11:47:00"), y: 97.4 },
		{ x: moment("2020-03-23T21:25:00"), y: 97.2 },
		{ x: moment("2020-03-24T13:53:00"), y: 97.5 },
		{ x: moment("2020-03-25T09:00:00"), y: 97.3 },
		{ x: moment("2020-03-25T10:30:00"), y: 97.4 },
		{ x: moment("2020-03-26T23:18:00"), y: 97.2 },
		{ x: moment("2020-03-27T22:07:00"), y: 97.5 },
		{ x: moment("2020-03-27T23:39:00"), y: 97.3 },
		{ x: moment("2020-03-28T09:50:00"), y: 97.3 },
	]
}

function calculateBar(data) {
	var data = data.map(function (d) { return d.y })
	var standardDeviation = getSD(data)

	console.log("[Maths] standardDeviation = " + standardDeviation)
	console.log("[Maths] chisqrdistr(data.length - 1, 0.95) = " + chisqrdistr(data.length - 1, 0.95))
	console.log("[Maths] Math.sqrt((data.length - 1) / chisqrdistr(data.length - 1, 0.95)) = " + Math.sqrt((data.length - 1) / chisqrdistr(data.length - 1, 0.95)))
	console.log("[Maths] 4 * standardDeviation * Math.sqrt((data.length - 1) / chisqrdistr(data.length - 1, 0.95)) = " + 4 * standardDeviation * Math.sqrt((data.length - 1) / chisqrdistr(data.length - 1, 0.95)))

	var result = 4 * standardDeviation * Math.sqrt((data.length - 1) / chisqrdistr(data.length - 1, 0.95))
	return result + getMean(data)
}

function getEarliestDate(data) {
	return data.reduce(function (a, b) {
		return a.x < b.x ? a : b
	}).x
}

function getLatestDate(data) {
	return data.reduce(function (a, b) {
		return a.x > b.x ? a : b
	}).x
}

function dataChanged() {
	var bar = calculateBar(chart.data.datasets[0].data)
	chart.data.datasets[1].data = [{
		x: getEarliestDate(chart.data.datasets[0].data),
		y: bar
	}, {
		x: getLatestDate(chart.data.datasets[0].data),
		y: bar
	}]

	console.log(chart.data.datasets[0].data.map(function (it) { return { x: it.x.toString(), y: it.y } }))
	console.log(chart.data.datasets[1].data)

	chart.update()
}

function login() {
	var provider = new firebase.auth.GoogleAuthProvider();
	firebase.auth().signInWithRedirect(provider);
}

function logout() {
	firebase.auth().signOut().then(function () {
		location.reload()
	}).catch(function (error) {
		console.error(error)
	});
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
	firebase.firestore();

	firebase.auth().getRedirectResult().then(function (result) {
		if (result.credential) {
			var token = result.credential.accessToken;
		}
		var user = result.user;
		main()
	}).catch(function (error) {
		var errorCode = error.code;
		var errorMessage = error.message;
		var email = error.email;
		var credential = error.credential;
		console.error(error)
	});
}

function main() {
	var user = firebase.auth().currentUser
	console.log(user)

	if (!user) {
		$('#loading').hide()
		$('#content_page').hide()
		$('#login_page').show()
	} else {
		$('#loading').hide()
		$('#login_page').hide()
		$('#content_page').show()

		$('#username').html(user.email)
		$('#user_info_bar').show()

		var chartContext = document.getElementById('chart').getContext('2d');
		chart = new Chart(chartContext, {
			type: 'line',
			data: {
				datasets: [{
					showLine: false,
					pointRadius: 5,
					pointBackgroundColor: '#55DD55',
					data: getTestDataPoints()
				}, {
					borderColor: '#FF0000',
					fill: false,
					showLine: true,
					pointRadius: 0,
					data: [{
						x: getEarliestDate(getTestDataPoints()),
						y: calculateBar(getTestDataPoints())
					}, {
						x: getLatestDate(getTestDataPoints()),
						y: calculateBar(getTestDataPoints())
					}]
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
		})

		$('#fieldset-btn').on('click', function () {
			chart.data.datasets[0].data.push({
				x: moment($('#datetime').val()),
				y: Math.round(100 * $('#temperature').val()) / 100
			})
			dataChanged()
			var expiration = moment().add(6, 'm').valueOf()
			document.cookie = "data=" + escape(JSON.stringify(chart.data.datasets[0].data)) + ";expires=" + expiration + ";"
			$('#fieldset').hide()
			$('#results').show()
		})

		$('#results-btn').on('click', function () {
			$('#results').hide()
			$('#fieldset').show()
		})

		$('#datetime').val(new Date().toDateInputValue())

		$('input[type=radio][name=inputTemperatureUnit]').change(function () {
			if (temperatureUnit == 'c' && this.value == 'f') {
				chart.data.datasets[0].data.forEach(function (e) { e.y = celsiusToFarenheit(e.y) })
				temperatureUnit = 'f'
				$('#displayFarenheit').prop('checked', true)
			}
			else if (temperatureUnit == 'f' && this.value == 'c') {
				chart.data.datasets[0].data.forEach(function (e) { e.y = farenheitToCelsius(e.y) })
				temperatureUnit = 'c'
				$('#displayCelsius').prop('checked', true)
			}
			dataChanged()
		});

		$('input[type=radio][name=displayTemperatureUnit]').change(function () {
			if (temperatureUnit == 'c' && this.value == 'f') {
				chart.data.datasets[0].data.forEach(function (e) { e.y = celsiusToFarenheit(e.y) })
				temperatureUnit = 'f'
				$('#inputFarenheit').prop('checked', true)
			}
			else if (temperatureUnit == 'f' && this.value == 'c') {
				chart.data.datasets[0].data.forEach(function (e) { e.y = farenheitToCelsius(e.y) })
				temperatureUnit = 'c'
				$('#inputCelsius').prop('checked', true)
			}
			dataChanged()
		});
	}
}