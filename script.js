$(document).ready(function () {
    function checkTime(i) {
        if (i < 10) {
            i = "0" + i;
        }
        return i;
    }
    function startTime() {
        var today = new Date();
        var h = today.getHours();
        var m = today.getMinutes();
        var s = today.getSeconds();
        // add a zero in front of numbers<10
        m = checkTime(m);
        s = checkTime(s);
        document.getElementById('time').innerHTML = h + ":" + m + ":" + s;
        t = setTimeout(function () {
            startTime()
        }, 500);
    }
    startTime();
    function HexToReal(number) { // 32 Bit - single prescision -- just for normalized numbers
        var sign = (number & 0x80000000);		// sign: 0=positive
        var exponent = (number & 0x7F800000) >> 23;	// exponent
        var mantissa = (number & 0x007FFFFF);		// mantissa

        if (exponent == 0x0000) {									// special: zero
            if (mantissa != 0)									// positive denormalized
                return Number.NaN;
            else												// normalized numbers
                return sign ? -0.0 : +0.0;
        }
        else if (exponent == 0x00FF) {							// 255 - special: ±INF or NaN
            if (mantissa != 0) {									// is mantissa non-zero? indicates NaN
                return Number.NaN;
            }
            else {												// otherwise it's ±INF
                return sign ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY;
            }
        }
        mantissa |= 0x00800000;

        exponent -= 127;										// adjust by BIAS
        var float_val = mantissa * Math.pow(2, exponent - 23);			// compute absolute result
        return sign ? -float_val : +float_val;					// and return positive or negative depending on sign
    }
    var v12_button = document.getElementById("v12");
    var PlotControlButtons = document.querySelector(".PlotControlButton");
    var ccObject = {
        'BusVoltage': 0,
        'BusInCurrent': 0,
        'BusInPowerInput': 0,
        'BusInPowerDrain': 0,
        'BusOutCurrent': 0,
        'BusOutPowerInput': 0,
        'BusOutPowerDrain': 0,
        'CapVoltage': 0,
        'CapCurrent': 0,
        'CapPowerInput': 0,
        'CapPowerDrain': 0,
        'EnergyInGenerated': 0,
        'EnergyOutGenerated': 0,
        'StartAddress': 40001,
        'DataLength': 2,
        'TestPeriod': 5,
        'DutyCycle': 10
    };
    var interval = null;
    var clearFlag = 0;
    var request_time = null;
    var intervalDuration = 100;
    var requestIdentifier = "1";
    var plotText = "Bus In Current";
    var ccObjectIndex = 'BusInCurrent';

    var smoothie1 = new SmoothieChart({
        showIntermediateLabels: true, minValueScale: 1, maxValueScale: 1, 
        tooltip: true, responsive: true, minValue: 0,
        title: { text: 'Bus Voltage', fillStyle: '#ffffff', fontSize: 15, fontFamily: 'sans-serif', verticalAlign: 'top' }
    });

    smoothie1.streamTo(document.getElementById("mycanvas1"));
    var line1 = new TimeSeries();
    smoothie1.addTimeSeries(line1, { strokeStyle: 'rgb(255, 255, 255)', fillStyle: 'rgba(255,255,255,0.56)', lineWidth: 3 });

    var smoothie2 = new SmoothieChart({
        minValueScale: 1, maxValueScale: 1, tooltip: true, responsive: true,
        title: { text: plotText, fillStyle: '#ffffff', fontSize: 15, fontFamily: 'sans-serif', verticalAlign: 'top' }
    });

    smoothie2.streamTo(document.getElementById("mycanvas2"));
    var line2 = new TimeSeries();
    smoothie2.addTimeSeries(line2, { strokeStyle: 'rgb(255, 255, 255)', fillStyle: 'rgba(255,255,255,0.56)', lineWidth: 3 });


    PlotControlButtons.addEventListener("click", changeGraph, false);
    function changeGraph(e) {
        if (e.target !== e.currentTarget) {
            clearFlag = 1;
            ccObjectIndex = e.target.id;
            requestIdentifier = e.target.value;
            document.querySelector("#CCDataActivity").className = "InActiveCCData";
            document.querySelector("#TagsState").className = "InActiveTags";
            Array.from(e.target.parentElement.children).forEach(function (element) {
                element.className = "PlotButtonInActive";
            });
            e.target.className = "PlotButtonActive";
            ValueToBePlotted = ccObject[e.target.id];
            switch (requestIdentifier) {
                case "1":
                case "2":
                case "10":
                    smoothie2.options.title.text = e.target.innerHTML + " Current (A)";
                    break;
                case "3":
                case "4":
                    smoothie2.options.title.text = e.target.innerHTML + " (J)";
                    break;
                case "5":
                case "6":
                case "7":
                case "8":
                    smoothie2.options.title.text = e.target.innerHTML + " (mW)";
                    break;

            }
            clearTimeout(interval);
            clearFlag = 0;
            intervalFunction();

        }
    }
    v12_button.onclick = function () {
        if (v12_button.className == "v12-off button") {
            v12_button.className = "v12-on button";
            v12_button.innerHTML = "v12 on";
        } else {
            v12_button.className = "v12-off button";
            v12_button.innerHTML = "v12 off";
        }
    }
    var start_time = new Date().getTime();
    function intervalFunction() {
        start_time = new Date().getTime();
        if (requestIdentifier == "9") {
            document.querySelector("#CCDataActivity").className = "ActiveCCData";
            document.querySelector("#TagsState").className = "InActiveTags";
            document.querySelector("#PlotActivityState").className = "InActivePlot";

        } else if (requestIdentifier == "11") {
            document.querySelector("#CCDataActivity").className = "InActiveCCData";
            document.querySelector("#TagsState").className = "ActiveTags";
            document.querySelector("#PlotActivityState").className = "InActivePlot";

        } else {
            document.querySelector("#CCDataActivity").className = "InActiveCCData";
            document.querySelector("#TagsState").className = "InActiveTags";
            document.querySelector("#PlotActivityState").className = "ActivePlot";
        }
        switch (requestIdentifier) {
            case "1"://bus in current and voltage
                $.ajax({
                    url: "Data1.json",
                    dataType: 'json',
                    type: "get",
                    cache: false,
                    // timeout: intervalDuration + 10,
                    error: function () {
                        console.warn("There has been an error with the ajax request");
                    },
                    success: function (data) {
                        ccObject = data;

                        request_time = new Date().getTime() - start_time;
                        document.querySelector("#RequestTime").textContent = `Request time: ${request_time}`;
                        line1.append(new Date().getTime(), HexToReal(ccObject.BusVoltage));
                        line2.append(new Date().getTime(), HexToReal(ccObject[ccObjectIndex]));
                        if (clearFlag == 0) {
                            intervalFunction();
                        }
                    }
                });
                break;
            case "2"://bus out current and voltage
                $.ajax({
                    url: "Data2.json",
                    dataType: 'json',
                    type: "get",
                    cache: false,
                    timeout: intervalDuration + 10,
                    success: function (data) {
                        ccObject = data;
                        request_time = new Date().getTime() - start_time;
                        document.querySelector("#RequestTime").textContent = `Request time: ${request_time}`;
                        line1.append(new Date().getTime(), HexToReal(ccObject.BusVoltage));
                        line2.append(new Date().getTime(), -1 * HexToReal(ccObject[ccObjectIndex]));
                        if (clearFlag == 0) {
                            intervalFunction();
                        }
                    }
                });
                break;
            case "3"://energy in generted and bus voltage
                $.ajax({
                    url: "Data3.json",
                    dataType: 'json',
                    type: "get",
                    cache: false,
                    timeout: intervalDuration + 10,
                    success: function (data) {
                        ccObject = data;
                        request_time = new Date().getTime() - start_time;
                        document.querySelector("#RequestTime").textContent = `Request time: ${request_time}`;
                        line1.append(new Date().getTime(), HexToReal(ccObject.BusVoltage));
                        line2.append(new Date().getTime(), HexToReal(ccObject[ccObjectIndex]));
                        if (clearFlag == 0) {
                            intervalFunction();
                        }
                    }
                });
                break;
            case "4"://Energy out generated and bus voltage
                $.ajax({
                    url: "Data4.json",
                    dataType: 'json',
                    type: "get",
                    cache: false,
                    timeout: intervalDuration + 10,
                    success: function (data) {
                        ccObject = data;
                        request_time = new Date().getTime() - start_time;
                        document.querySelector("#RequestTime").textContent = `Request time: ${request_time}`;
                        line1.append(new Date().getTime(), HexToReal(ccObject.BusVoltage));
                        line2.append(new Date().getTime(), HexToReal(ccObject[ccObjectIndex]));
                        if (clearFlag == 0) {
                            intervalFunction();
                        }
                    }
                });
                break;
            case "5"://bus in power input and bus voltage
                $.ajax({
                    url: "Data5.json",
                    dataType: 'json',
                    type: "get",
                    cache: false,
                    timeout: intervalDuration + 10,
                    success: function (data) {
                        ccObject = data;
                        request_time = new Date().getTime() - start_time;
                        document.querySelector("#RequestTime").textContent = `Request time: ${request_time}`;
                        line1.append(new Date().getTime(), HexToReal(ccObject.BusVoltage));
                        line2.append(new Date().getTime(), ccObject[ccObjectIndex]);
                        if (clearFlag == 0) {
                            intervalFunction();
                        }
                    }
                });
                break;
            case "6"://bus out power input and bus voltage
                $.ajax({
                    url: "Data6.json",
                    dataType: 'json',
                    type: "get",
                    cache: false,
                    timeout: intervalDuration + 10,
                    success: function (data) {
                        ccObject = data;
                        request_time = new Date().getTime() - start_time;
                        document.querySelector("#RequestTime").textContent = `Request time: ${request_time}`;
                        line1.append(new Date().getTime(), HexToReal(ccObject.BusVoltage));
                        line2.append(new Date().getTime(), ccObject[ccObjectIndex]);
                        if (clearFlag == 0) {
                            intervalFunction();
                        }
                    }
                });
                break;
            case "7"://bus in power drain and bus voltage
                $.ajax({
                    url: "Data7.json",
                    dataType: 'json',
                    type: "get",
                    cache: false,
                    timeout: intervalDuration + 10,
                    success: function (data) {
                        ccObject = data;
                        request_time = new Date().getTime() - start_time;
                        document.querySelector("#RequestTime").textContent = `Request time: ${request_time}`;
                        line1.append(new Date().getTime(), HexToReal(ccObject.BusVoltage));
                        line2.append(new Date().getTime(), ccObject[ccObjectIndex]);
                        if (clearFlag == 0) {
                            intervalFunction();
                        }
                    }
                });
                break;
            case "8"://bus out power drain and bus voltage
                $.ajax({
                    url: "Data8.json",
                    dataType: 'json',
                    type: "get",
                    cache: false,
                    timeout: intervalDuration + 10,
                    success: function (data) {
                        ccObject = data;
                        request_time = new Date().getTime() - start_time;
                        document.querySelector("#RequestTime").textContent = `Request time: ${request_time}`;
                        line1.append(new Date().getTime(), HexToReal(ccObject.BusVoltage));
                        line2.append(new Date().getTime(), ccObject[ccObjectIndex]);
                        if (clearFlag == 0) {
                            intervalFunction();
                        }
                    }
                });
                break;
            case "9"://all data for the tables section
                $.ajax({
                    url: "CCData.json",
                    dataType: 'json',
                    type: "get",
                    cache: false,
                    // timeout: intervalDuration + 10,
                    success: function (data) {
                        ccObject = data;
                        request_time = new Date().getTime() - start_time;
                        document.querySelector("#RequestTime").textContent = `Request time: ${request_time}`;
                        document.querySelectorAll("#BusInTable tr")[1].children[0].innerHTML = HexToReal(ccObject.BusVoltage).toFixed(2);
                        document.querySelectorAll("#BusInTable tr")[1].children[1].innerHTML = HexToReal(ccObject.BusInCurrent).toFixed(2);
                        document.querySelectorAll("#BusInTable tr")[1].children[2].innerHTML = ccObject.BusInPowerInput;
                        document.querySelectorAll("#BusInTable tr")[1].children[3].innerHTML = ccObject.BusInPowerDrain;

                        document.querySelectorAll("#BusOutTable tr")[1].children[0].innerHTML = HexToReal(ccObject.BusVoltage).toFixed(2);
                        document.querySelectorAll("#BusOutTable tr")[1].children[1].innerHTML = -1 * HexToReal(ccObject.BusOutCurrent).toFixed(2);
                        document.querySelectorAll("#BusOutTable tr")[1].children[2].innerHTML = ccObject.BusOutPowerInput;
                        document.querySelectorAll("#BusOutTable tr")[1].children[3].innerHTML = ccObject.BusOutPowerDrain;

                        document.querySelectorAll("#CapTable tr")[1].children[0].innerHTML = HexToReal(ccObject.CapVoltage).toFixed(2);
                        document.querySelectorAll("#CapTable tr")[1].children[1].innerHTML = HexToReal(ccObject.CapCurrent).toFixed(2);
                        document.querySelectorAll("#CapTable tr")[1].children[2].innerHTML = ccObject.CapPowerInput;
                        document.querySelectorAll("#CapTable tr")[1].children[3].innerHTML = ccObject.CapPowerDrain;
                        if (clearFlag == 0) {
                            intervalFunction();
                        }
                    }
                });
                break;
            case "10"://cap current and cap voltage
                $.ajax({
                    url: "CAP.json",
                    dataType: 'json',
                    type: "get",
                    cache: false,
                    timeout: intervalDuration + 10,
                    success: function (data) {
                        ccObject = data;
                        request_time = new Date().getTime() - start_time;
                        document.querySelector("#RequestTime").textContent = `Request time: ${request_time}`;
                        line1.append(new Date().getTime(), HexToReal(ccObject.CapVoltage));
                        line2.append(new Date().getTime(), HexToReal(ccObject.CapCurrent));
                        if (clearFlag == 0) {
                            intervalFunction();
                        }
                    }
                });
                break;
            case "11"://plc triggers section values
                $.ajax({
                    url: "PLCControl.json",
                    dataType: 'json',
                    type: "get",
                    cache: false,
                    timeout: intervalDuration + 10,
                    success: function (data) {
                        ccObject = data;
                        request_time = new Date().getTime() - start_time;
                        document.querySelector("#RequestTime").textContent = `Request time: ${request_time}`;
                        document.querySelector('#CreateCurrentValue').innerHTML = "Current Value: " + ccObject.CreateLog;
                        document.querySelector('#OpenCurrentValue').innerHTML = "Current Value: " + ccObject.OpenLog;
                        document.querySelector('#ClearCurrentValue').innerHTML = "Current Value: " + ccObject.ClearLog;
                        document.querySelector('#DeleteCurrentValue').innerHTML = "Current Value: " + ccObject.DeleteLog;
                        document.querySelector('#WritingCommandCurrentValue').innerHTML = "Current Value: " + ccObject.StartWriteLog;
                        if (ccObject.ReadTrig == 0) {
                            document.querySelector('#ReadingCurrentValue').innerHTML = "Status: Reading is OFF";
                        } else {
                            document.querySelector('#ReadingCurrentValue').innerHTML = "Status: Reading is ON";
                        }
                        document.querySelector('#startAddressCurrentValue').innerHTML = "Current Value: " + ccObject.StartAddress;
                        document.querySelector('#DataLengthCurrentValue').innerHTML = "Current Value: " + ccObject.DataLength;
                        document.querySelector('#TestPeriodCurrentValue').innerHTML = "Current Value: " + ccObject.TestPeriod;
                        document.querySelector('#DutyCycleCurrentValue').innerHTML = "Current Value: " + ccObject.DutyCycle;
                        if (clearFlag == 0) {
                            intervalFunction();
                        }
                    }
                });
                break;
        }
    }
    // __________Stop interval when pressed
    document.querySelector("#ClearInterval").onclick = function () {
        // clearTimeout(interval);
        clearFlag = 1; //if flag is set then next interval function call won't execute
        clearTimeout(interval);
        document.querySelector("#CCDataActivity").className = "InActiveCCData";
        document.querySelector("#TagsState").className = "InActiveTags";
        document.querySelector("#PlotActivityState").className = "InActivePlot";
    }
    document.querySelector("#StartInterval").onclick = function () {
        clearFlag = 0;
        clearTimeout(interval);
        intervalDuration = document.querySelector("#intervalInput").value;
        // interval = setTimeout(intervalFunction, intervalDuration);
        document.querySelector("#PlotActivityState").className = "ActivePlot";
        interval = setTimeout(intervalFunction, intervalDuration);
    }
    document.querySelector("#CCDataButton").onclick = function () {
        clearFlag = 0;
        clearTimeout(interval);
        intervalDuration = 1000;
        requestIdentifier = "9";
        interval = setTimeout(intervalFunction, intervalDuration);
    }
    document.querySelector("#TagButton").onclick = function () {
        clearFlag = 0;
        clearTimeout(interval);
        intervalDuration = 1000;
        requestIdentifier = "11";
        interval = setTimeout(intervalFunction, intervalDuration);
    }
    $("#LogCreateButton").click(function (e) {
        url = "Outputs.htm";
        name = 'DB16.DBX16.0';
        sdata = escape(name) + '=1';
        $.post(url, sdata, function () {
            sdata = escape(name) + '=0';
            $.post(url, sdata);
        });
    });
    $("#LogOpenButton").click(function (e) {
        url = "Outputs.htm";
        name = 'DB16.DBX16.1';
        sdata = escape(name) + '=1';
        $.post(url, sdata, function () {
            sdata = escape(name) + '=0';
            $.post(url, sdata);
        });
    });
    $("#LogClearButton").click(function (e) {
        url = "Outputs.htm";
        name = 'DB16.DBX16.2';
        sdata = escape(name) + '=1';
        $.post(url, sdata, function () {
            sdata = escape(name) + '=0';
            $.post(url, sdata);
        });
    });
    $("#LogDeleteButton").click(function (e) {
        url = "Outputs.htm";
        name = 'DB16.DBX16.3';
        sdata = escape(name) + '=1';
        $.post(url, sdata, function () {
            sdata = escape(name) + '=0';
            $.post(url, sdata);
        });
    });
    $("#LogWriteButton").click(function (e) {
        url = "Outputs.htm";
        name = 'DB16.DBX16.5';
        sdata = escape(name) + '=1';
        $.post(url, sdata, function () {
            sdata = escape(name) + '=0';
        });
    });
    $("#StartReadButton").click(function (e) {
        url = "Outputs.htm";
        name = 'DB16.DBX16.4';
        val = $('input[id=ReadTrig]').val();
        sdata = escape(name) + '=' + val;
        $.post(url, sdata);
    });
    $("#DataLengthButton").click(function () {
        url = "Outputs.htm";
        name = 'DB16.DBW18';
        val = $('input[id=DataLength]').val();
        sdata = escape(name) + '=' + val;
        $.post(url, sdata);
    });
    $("#AddressButton").click(function () {
        url = "Outputs.htm";
        name = 'DB16.DBD20';
        val = $('input[id=StartAddress]').val();
        sdata = escape(name) + '=' + val;
        $.post(url, sdata);
    });
    $("#DTButton").click(function () {
        url = "Outputs.htm";
        name = 'DB16.DBD24';
        val = $('input[id=DutyCycle]').val();
        sdata = escape(name) + '=' + val;
        $.post(url, sdata);
    });
    $("#TestPeriodButton").click(function () {
        url = "Outputs.htm";
        name = 'DB16.DBD12';
        val = $('input[id=TestPeriod]').val();
        sdata = escape(name) + '=' + val;
        $.post(url, sdata);
    });
    document.querySelector(".Tabs").onclick = function (e) {
        if (e.target.classList.contains("Tab1")) {
            document.querySelector(".MiscButtons").classList.remove("hidden");
            document.querySelector(".TestInfo").classList.add("hidden");

        }
        if (e.target.classList.contains("Tab2")) {
            document.querySelector(".MiscButtons").classList.add("hidden");
            document.querySelector(".TestInfo").classList.remove("hidden");
        }
    }
    var TestInfo = {
        title: "",
        SerialNmber: "",
        Description: ""
    }
    document.querySelector(".TestInfo button").onclick = function (e) {
        TestInfo.title = e.target.parentElement.children[2].value;
        TestInfo.SerialNmber = e.target.parentElement.children[4].value;
        TestInfo.Description = e.target.parentElement.children[6].value;
        console.log(TestInfo);
        document.querySelector("#testTitle").innerHTML = TestInfo.title;
        document.querySelector("#testSerial").innerHTML = TestInfo.SerialNmber;
        document.querySelector("#testDescription").innerHTML = TestInfo.Description;
        document.querySelector(".TestInfo fieldset").classList.add("hidden");
        document.querySelector(".submitted").classList.remove("hidden");
    }
    document.querySelector(".submitted button").onclick = function (e) {
        console.log(e.target.parentElement);
        document.querySelector(".TestInfo fieldset").classList.remove("hidden");
        e.target.parentElement.classList.add("hidden");
    }
});
// _____Don't add lines below this line to stay inside the onready scope!!!_________