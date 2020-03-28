window.onload = function() {
    $('#fieldset-btn').on('click', function() {
        $('#fieldset').hide()
        $('#results').show()
    })

    $('#results-btn').on('click', function() {
        $('#results').hide()
        $('#fieldset').show()
    })
}