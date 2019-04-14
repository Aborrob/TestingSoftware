$(document).ready(function () {
    // Button elements
    var v12_button = document.getElementById("v12");
    // var BusOutCutrrentB = document.getElementById("BusOutCurrent");
    // var BusOutPowerInputB = document.getElementById("BusOutPowerInput");
    // var BusOutPowerDrainB = document.getElementById("BusOutPowerDrain");
    // var EnergyInGenerated = document.getElementById("EnergyInGenerated");
    // var EnergyOutGeneratedB = document.getElementById("EnergyOutGenerated");
    // var BusInPowerInputB = document.getElementById("BusInPowerInput");
    // var BusInPowerDrainB = document.getElementById("BusInPowerDrain");
    // var BusInCurrentB = document.getElementById("BusInCurrent");
    var PlotControlButtons = document.querySelector(".PlotControlButton");
    // _________________________________^^^^^^^Buttons ^^^^^^___________________
    // Initialisation_______________
    var ccObject = {
        'BusVoltage': 0,
        'BusInCurrent': 0,
        'BusInPowerInput': 0,
        'BusInPowerDrain': 0,
        'BusOutCurrent': 0,
        'BusOutPowerInput': 0,
        'BusOutPowerDrain': 0,
        'CapCurrent': 0,
        'CapPowerInput': 0,
        'CapPowerDrain': 0,
        'EnergyInGenerated': 0,
        'EnergyOutGenerated': 0
    };
    var ValueToBePlotted = ccObject.BusInCurrent;
    var plotText = "Bus In Current";
    var smoothie1 = new SmoothieChart({ responsive: true, minValue: 0, title: { text: 'Bus Voltage', fillStyle: '#ffffff', fontSize: 15, fontFamily: 'sans-serif', verticalAlign: 'top' } });
    var smoothie2 = new SmoothieChart({ responsive: true, minValue: 0, title: { text: plotText, fillStyle: '#ffffff', fontSize: 15, fontFamily: 'sans-serif', verticalAlign: 'top' } });
    smoothie1.streamTo(document.getElementById("mycanvas1"));
    smoothie2.streamTo(document.getElementById("mycanvas2"));
    var line1 = new TimeSeries();
    var line2 = new TimeSeries();
    //    ______________Initialisation Done____________

    // _________________________________\/ \/ \/On Click \/ \/ \/ _______________
    PlotControlButtons.addEventListener("click", changeGraph, false);
    function changeGraph(e) {
        if (e.target !== e.currentTarget) {
            e.target.value = 1;
            ValueToBePlotted = ccObject[e.target.id];
            plotText = e.target.innerHTML;
            smoothie2.options.title.text = e.target.innerHTML;
            console.log(smoothie2.options.title.text);

        }
    }

    // _________________________________________/\/\/\/\/\On click /\/\/\/\/\_________
    v12_button.onclick = function () {
        if (v12_button.className == "v12-off button") {
            v12_button.className = "v12-on button";
            v12_button.innerHTML = "v12 on";
        } else {
            v12_button.className = "v12-off button";
            v12_button.innerHTML = "v12 off";
        }
    }
    // ___________________________Stream To Canvas___second argument could be added for delay in ms___
    setInterval(function () {
        $.ajax({
            url: "Data.json",
            dataType: 'json',
            type: "get",
            cache: false,
            success: function (data) {
                ccObject = data;
                line1.append(new Date().getTime(), ccObject.BusVoltage);
                line2.append(new Date().getTime(), ValueToBePlotted);
                // console.log(ValueToBePlotted);

                // $('#testField').text(ccObject.CreateLog);
                $('#CreateCurrentValue').text("Current Value: " + ccObject.CreateLog);
                $('#OpenCurrentValue').text("Current Value: " + ccObject.OpenLog);
                $('#ClearCurrentValue').text("Current Value: " + ccObject.ClearLog);
                $('#DeleteCurrentValue').text("Current Value: " + ccObject.DeleteLog);
                $('#WritingCommandCurrentValue').text("Current Value: " + ccObject.StartWriteLog);
                if (ccObject.ReadTrig == 0) {
                    $('#ReadingCurrentValue').text("Status: <b>Reading is OFF</b>");
                }else{
                    $('#ReadingCurrentValue').text("Status: <b>Reading is ON</b>");
                }
                // Data Address and Data length Control
                $('#startAddressCurrentValue').text("Current Value: " + ccObject.StartAddress);
                // Timers Control for reading Modbus data (Req freq.)
                $('#TestPeriodCurrentValue').text("Current Value: " + ccObject.TestPeriod);
                $('#DutyCycleCurrentValue').text("Current Value: " + ccObject.DutyCycle);
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
    $("#DataLengthButton").click(function () {
        url = "Outputs.htm";
        name = 'DB16.DBW2';
        val = $('input[id=DataLength]').val();
        sdata = escape(name) + '=' + val;
        $.post(url, sdata, function (result) { });
    });
    $("#AddressButton").click(function () {
        url = "Outputs.htm";
        name = 'DB16.DBD4';
        val = $('input[id=StartAddress]').val();
        sdata = escape(name) + '=' + val;
        $.post(url, sdata, function (result) { });
    });
    $("#DTButton").click(function () {
        url = "Outputs.htm";
        name = 'DB16.DBD8';
        val = $('input[id=DutyCycle]').val();
        sdata = escape(name) + '=' + val;
        $.post(url, sdata, function (result) { });
    });
    $("#TestPeriodButton").click(function () {
        url = "Outputs.htm";
        name = 'DB16.DBD12';
        val = $('input[id=TestPeriod]').val();
        sdata = escape(name) + '=' + val;
        $.post(url, sdata, function (result) { });
    });
}); 