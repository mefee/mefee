Date.prototype.toDateInputValue = (function() {
    var local = new Date(this);
    local.setMinutes(this.getMinutes() - this.getTimezoneOffset());
    return local.toJSON().slice(0,16);
});

window.onload = function() {
    $('#fieldset-btn').on('click', function() {
        $('#fieldset').hide()
        $('#results').show()
    })

    $('#results-btn').on('click', function() {
        $('#results').hide()
        $('#fieldset').show()
    })

    console.log(new this.Date().toDateInputValue())
    $('#datetime').val(new Date().toDateInputValue())
}