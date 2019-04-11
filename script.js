var v12_button = document.getElementById("v12");

v12_button.onclick = function () {
    if (v12_button.className == "v12-off button") {
        v12_button.className = "v12-on button";
        v12_button.innerHTML = "v12 on";
    } else {
        v12_button.className = "v12-off button";
        v12_button.innerHTML = "v12 off";
    }

};

$(document).ready(function () {
    var ccObject = {
        'BusVoltage': 0,
        'BusInCurrent': 0
    };

    // Consider changing the interpolation (animation smoothness) to 'bezier', or just delete the 'step' and interpolation key value pair
    var smoothie1 = new SmoothieChart({ minValue: 0, title: { text: 'Bus Voltage', fillStyle: '#ffffff', fontSize: 15, fontFamily: 'sans-serif', verticalAlign: 'top' } });
    var smoothie2 = new SmoothieChart({ minValue: 0, title: { text: 'Bus In Current', fillStyle: '#ffffff', fontSize: 15, fontFamily: 'sans-serif', verticalAlign: 'top' } });

    smoothie1.streamTo(document.getElementById("mycanvas1"));
    smoothie2.streamTo(document.getElementById("mycanvas2"));
    // Data
    var line1 = new TimeSeries();
    var line2 = new TimeSeries();

    setInterval(function () {
        $.ajax({
            url: "Data.json",
            dataType: 'json',
            type: "get",
            cache: false,
            success: function (data) {
                ccObject = data;
                line1.append(new Date().getTime(), ccObject.BusVoltage);
                line2.append(new Date().getTime(), ccObject.BusInCurrent);
                // $('#testField').text(ccObject.CreateLog);
                $('#CreateCurrentValue').text("Current Value: " + ccObject.CreateLog);
                $('#OpenCurrentValue').text("Current Value: " + ccObject.OpenLog);
                $('#ClearCurrentValue').text("Current Value: " + ccObject.ClearLog);
                $('#DeleteCurrentValue').text("Current Value: " + ccObject.DeleteLog);
                $('#WritingCommandCurrentValue').text("Current Value: " + ccObject.StartWriteLog);
                $('#ReadingCurrentValue').text("Current Value: " + ccObject.ReadTrig);
            }
        });
        // $("#CreateCurrentValue").text("Current Value: " + ccObject.CreateLog);
        // $('#testField').text(ccObject.CreateLog);
    }, 1000);
    smoothie1.addTimeSeries(line1,
        { strokeStyle: 'rgb(0, 255, 0)', fillStyle: 'rgba(0, 255, 0, 0.4)', lineWidth: 3 });
    smoothie2.addTimeSeries(line2,
        { strokeStyle: 'rgb(0, 255, 0)', fillStyle: 'rgba(0, 255, 0, 0.4)', lineWidth: 3 });
    $("#LogCreateButton").click(function () {
        url = "Outputs.htm";
        name = 'DB16.DBX0.0';
        val = $("#CreateTrig").val();
        sdata = escape(name) + '=' + val;
        $.post(url, sdata, function (result) { });
    });

    $("#LogOpenButton").click(function () {
        url = "Outputs.htm";
        name = 'DB16.DBX0.1';
        val = $('input[id=OpenTrig]').val();
        sdata = escape(name) + '=' + val;
        $.post(url, sdata, function (result) { });
    });

    $("#LogClearButton").click(function () {
        url = "Outputs.htm";
        name = 'DB16.DBX0.2';
        val = $('input[id=ClearTrig]').val();
        sdata = escape(name) + '=' + val;
        $.post(url, sdata, function (result) { });
    });

    $("#LogDeleteButton").click(function () {
        url = "Outputs.htm";
        name = 'DB16.DBX0.3';
        val = $('input[id=DeleteTrig]').val();
        sdata = escape(name) + '=' + val;
        $.post(url, sdata, function (result) { });
    });

    $("#LogWriteButton").click(function () {
        url = "Outputs.htm";
        name = 'DB16.DBX0.5';
        val = $('input[id=WriteTrig]').val();
        sdata = escape(name) + '=' + val;
        $.post(url, sdata, function (result) { });
    });

    $("#StartReadButton").click(function () {
        url = "Outputs.htm";
        name = 'DB16.DBX0.4';
        val = $('input[id=ReadTrig]').val();
        sdata = escape(name) + '=' + val;
        $.post(url, sdata, function (result) { });
    });

}); 