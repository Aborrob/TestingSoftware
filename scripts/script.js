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
        'DutyCycle': 10,
        'WritingOutputState': 0
    };
    var plcType = "1200";
    var interval = null;
    var clearFlag = 0;
    var request_time = null;
    var intervalDuration = 100;
    var requestIdentifier = "1";
    var plotText = "Choose from Plot Options";
    var ccObjectIndex = 'BusInCurrent';
    var writeRequestFlag = 0;
    var smoothie1 = new SmoothieChart({
        showIntermediateLabels: true, minValueScale: 1.2, maxValueScale: 1.2,
        tooltip: true, responsive: true, minValue: 0,
        title: { text: 'Bus Voltage (V)', fillStyle: '#ffffff', fontSize: 15, fontFamily: 'sans-serif', verticalAlign: 'top' }
    });
    //Smoothie one___________________//
    smoothie1.streamTo(document.getElementById("mycanvas1"));
    var line1 = new TimeSeries();
    smoothie1.addTimeSeries(line1, { strokeStyle: 'rgb(255, 255, 255)', fillStyle: 'rgba(255,255,255,0.56)', lineWidth: 3 });

    var smoothie2 = new SmoothieChart({
        minValueScale: 1.2, maxValueScale: 1.2, tooltip: true, responsive: true, minValue: 0,
        title: { text: plotText, fillStyle: '#ffffff', fontSize: 15, fontFamily: 'sans-serif', verticalAlign: 'top' }
    });
    //Smoothie Two_____________________//
    smoothie2.streamTo(document.getElementById("mycanvas2"));
    var line2 = new TimeSeries();
    smoothie2.addTimeSeries(line2, { strokeStyle: 'rgb(255, 255, 255)', fillStyle: 'rgba(255,255,255,0.56)', lineWidth: 3 });


    PlotControlButtons.addEventListener("click", changeGraph, false);
    function changeGraph(e) {
        if (e.target !== e.currentTarget) {
            line1.clear();
            line2.clear();
            smoothie1.start();
            smoothie2.start();
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
            document.querySelector(".CCDataState").innerHTML = "Status: Active";
            document.querySelector("#TagsState").className = "InActiveTags";
            document.querySelector(".TagsState").innerHTML = "Status: Inactive";
            document.querySelector("#PlotActivityState").className = "InActivePlot";

        } else if (requestIdentifier == "11") {
            document.querySelector("#CCDataActivity").className = "InActiveCCData";
            document.querySelector(".CCDataState").innerHTML = "Status: Inactive";
            document.querySelector("#TagsState").className = "ActiveTags";
            document.querySelector(".TagsState").innerHTML = "Status: Active";
            document.querySelector("#PlotActivityState").className = "InActivePlot";

        } else {
            document.querySelector("#CCDataActivity").className = "InActiveCCData";
            document.querySelector(".CCDataState").innerHTML = "Status: Inactive";
            document.querySelector("#TagsState").className = "InActiveTags";
            document.querySelector(".TagsState").innerHTML = "Status: Inactive";
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
                        document.querySelector('#CreateCurrentValue').innerHTML = "Value= " + ccObject.CreateLog;
                        document.querySelector('#OpenCurrentValue').innerHTML = "Value= " + ccObject.OpenLog;
                        document.querySelector('#ClearCurrentValue').innerHTML = "Value= " + ccObject.ClearLog;
                        document.querySelector('#DeleteCurrentValue').innerHTML = "Value= " + ccObject.DeleteLog;
                        document.querySelector('#WritingCommandCurrentValue').innerHTML = "Value= " + ccObject.StartWriteLog;
                        if (ccObject.ReadTrig == 0) {
                            document.querySelector('#ReadingCurrentValue').innerHTML = "Status: Reading is OFF";
                        } else {
                            document.querySelector('#ReadingCurrentValue').innerHTML = "Status: Reading is ON";
                        }
                        if (ccObject.WritingOutputState == 0 && writeRequestFlag == 1) {
                            $.post("Outputs.htm", 'DB16.DBX16.5=0')
                            writeRequestFlag = 0;
                        }
                        document.querySelector('#startAddressCurrentValue').innerHTML = "Value= " + ccObject.StartAddress;
                        document.querySelector('#DataLengthCurrentValue').innerHTML = "Value= " + ccObject.DataLength;
                        document.querySelector('#TestPeriodCurrentValue').innerHTML = "Value= " + ccObject.TestPeriod;
                        document.querySelector('#DutyCycleCurrentValue').innerHTML = "Value= " + ccObject.DutyCycle;
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
        line1.clear();
        line2.clear();
        smoothie1.stop();
        smoothie2.stop();
        document.querySelector("#CCDataActivity").className = "InActiveCCData";
        document.querySelector("#TagsState").className = "InActiveTags";
        document.querySelector("#PlotActivityState").className = "InActivePlot";
        document.querySelector(".CCDataState").innerHTML = "Status: Inactive";
        document.querySelector(".TagsState").innerHTML = "Status: Inactive";


    }
    document.querySelector("#StartInterval").onclick = function () {
        clearFlag = 0;
        clearTimeout(interval);
        line1.clear();
        line2.clear();
        smoothie1.start()
        smoothie2.start();
        intervalDuration = 10;
        document.querySelector("#PlotActivityState").className = "ActivePlot";
        interval = setTimeout(intervalFunction, intervalDuration);
    }
    document.querySelector("#plotSettings").onclick = function () {
        if (document.querySelector("#plotSettings").innerHTML == "Plot Settings") {
            Array.from(document.querySelector(".XHR").children).forEach(function (element) {
                element.classList.add("hidden");
            })
            document.querySelector(".XHR legend").innerHTML = "Plot Settings";
            document.querySelector(".XHR legend").classList.remove("hidden");
            document.querySelector("#plotSettings").classList.remove("hidden");
            document.querySelector("#plotSettings").innerHTML = "XHR settings";
            document.querySelector("#panSpeed").classList.remove("hidden");
            document.querySelector("#panSpeedText").classList.remove("hidden");
            document.querySelector("#panSpeedButton").classList.remove("hidden");
            document.querySelector("#minYText").classList.remove("hidden");
            document.querySelector("#minY").classList.remove("hidden");
            document.querySelector("#minYButton").classList.remove("hidden");
        } else {
            document.querySelector("#plotSettings").innerHTML = "Plot Settings";
            Array.from(document.querySelector(".XHR").children).forEach(function (element) {
                element.classList.remove("hidden");
            })
            document.querySelector(".XHR legend").innerHTML = "XHR Control";
            document.querySelector(".XHR legend").classList.remove("hidden");
            document.querySelector("#plotSettings").classList.remove("hidden");
            document.querySelector("#plotSettings").innerHTML = "Plot Settings";
            document.querySelector("#panSpeed").classList.add("hidden");
            document.querySelector("#panSpeedText").classList.add("hidden");
            document.querySelector("#panSpeedButton").classList.add("hidden");
            document.querySelector("#minYText").classList.add("hidden");
            document.querySelector("#minY").classList.add("hidden");
            document.querySelector("#minYButton").classList.add("hidden");
        }
        document.querySelector("#panSpeedButton").onclick = function () {
            if (document.querySelector("#panSpeed").value <= 100 && document.querySelector("#panSpeed").value >= 10) {
                smoothie1.options.millisPerPixel = document.querySelector("#panSpeed").value;
                smoothie2.options.millisPerPixel = document.querySelector("#panSpeed").value;
            } else {
                smoothie1.options.millisPerPixel = 20;
                smoothie2.options.millisPerPixel = 20;

            }
        }
        document.querySelector("#minYButton").onclick = function () {
            smoothie2.options.minValue = document.querySelector("#minY").value;

        }

    }
    document.querySelector("#CCDataButton").onclick = function () {
        clearFlag = 0;
        clearTimeout(interval);
        line1.clear();
        line2.clear();
        smoothie1.stop();
        smoothie2.stop();
        intervalDuration = 1000;
        requestIdentifier = "9";
        interval = setTimeout(intervalFunction, intervalDuration);
    }
    document.querySelector("#TagButton").onclick = function () {
        clearFlag = 0;
        clearTimeout(interval);
        line1.clear();
        line2.clear();
        smoothie1.stop();
        smoothie2.stop();
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
            writeRequestFlag = 1;
        });
    });

    //Read input field is removed from the html page, only reading stutus is shown isntead
    // $("#StartReadButton").click(function (e) {
    //     url = "Outputs.htm";
    //     name = 'DB16.DBX16.4';
    //     val = $('input[id=ReadTrig]').val();
    //     sdata = escape(name) + '=' + val;
    //     $.post(url, sdata);
    // });
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
    //Speech recognition
    function speechListener() {
        window.SpeechRecognition =
            window.SpeechRecognition || window.webkitSpeechRecognition;

        const recognition = new SpeechRecognition();
        recognition.lang = "en-US";

        recognition.addEventListener("end", recognition.start);

        recognition.addEventListener("result", e => {
            const res = Array.from(e.results).map(result => result[0].transcript.toLowerCase());
            console.log(res);
            if (res == "obliviate") {
                document.querySelector(".grid-container").classList.add("obliviate");
            } else if (res == "lumos" || res == "alohomora") {
                document.querySelector(".grid-container").classList.remove("obliviate");
            } else if (res == "avada kedavra") {
                cursed();
            }else if (res == "expecto patronum"){
                heal();\
            }
        });

        recognition.start();
    }

    speechListener();
    function cursed() {
        $(".wrapper").mgGlitch({
            // set 'true' to stop the plugin
            destroy: false,
            // set 'false' to stop glitching
            glitch: true,
            // set 'false' to stop scaling
            scale: true,
            // set 'false' to stop glitch blending
            blend: true,
            // select blend mode type
            blendModeType: 'hue',
            // set min time for glitch 1 elem
            glitch1TimeMin: 600,
            // set max time for glitch 1 elem
            glitch1TimeMax: 900,
            // set min time for glitch 2 elem
            glitch2TimeMin: 10,
            // set max time for glitch 2 elem
            glitch2TimeMax: 115,
            // z-index
            zIndexStart: 5
        });
    }
    function heal() {
        $(".wrapper").mgGlitch({
            // set 'true' to stop the plugin
            destroy: true,
            // set 'false' to stop glitching
            glitch: true,
            // set 'false' to stop scaling
            scale: true,
            // set 'false' to stop glitch blending
            blend: true,
            // select blend mode type
            blendModeType: 'hue',
            // set min time for glitch 1 elem
            glitch1TimeMin: 600,
            // set max time for glitch 1 elem
            glitch1TimeMax: 900,
            // set min time for glitch 2 elem
            glitch2TimeMin: 10,
            // set max time for glitch 2 elem
            glitch2TimeMax: 115,
            // z-index
            zIndexStart: 5
        });
    }


    //speech recognition End_______
    // Datalog Graph__________________________________
    $.init = function (whichValue) {
        S7Framework.initialize(plcType, "");
        S7Framework.readDataLog("logging", "Read Datalog failed", decodeCSV); //read the dataLog with the name SinusUndCosinus and give the data to the function decodeCSV
        $("#updData").click(function () {
            S7Framework.readDataLog("logging", "Read Datalog Failed", decodeCSV);
        });
    }
    // DecodeCSV__________________
    // function decodeCSV(CSVdata) {//CSVdata = data of dataLog
    //     console.info("CSV-Data");
    //     console.log(CSVdata);
    //     var data;

    //     // seperate lines in array
    //     CSVdata = CSVdata.split("\r\n"); //Array consisiting of elements. The element is a whole line, the first element/line is the header
    //     // seperate header data
    //     var CSVheader = CSVdata[0].split(",");
    //     for (var i = 0; i < CSVheader.length; i++) {
    //         CSVheader[i] = CSVheader[i].trim();//The trim() method removes whitespace from both ends of a string.
    //     }
    //     CSVheader.shift();//removes the first element of the array (this will be the first elemnet in the header which is "Record")
    //     var xLabel = CSVheader[0];
    //     CSVheader.shift();//second shift removes the second element of the array (this will be the first elemnet in the header now which is "Date")
    //     CSVheader.shift();//third shift removes the third element of the array (this will be the first elemnet in the header now which is "UTC Time")

    //     console.info("CSV Header");
    //     console.log(CSVheader);

    //     console.info("CSV-Data Lines");
    //     console.log(CSVdata);
    //     var CSVdataCustomLength = CSVdata.length - 2;
    //     // seperate data in lines into array
    //     for (var i = 0; i < CSVdata.length - 2; i++) {//loops through the lines
    //         CSVdata[i] = CSVdata[i + 1].split(","); //each line is now an array of elements in the different columns so CSVdata[i][array returned by the split] so at this point the array has two dimensions
    //         // sequenz no / entrance ID
    //         CSVdata[i][0] = parseInt(CSVdata[i][0]);//ensures the returned value of the first elemnt in the array is an integer since it correlates to the record number from the log file

    //         // Values convert time in DataLog to "Date.UTC". This data-type can be read by the graph template
    //         var timeStr1Split;
    //         var timeStr2Split;
    //         var timeStamp;
    //         if (plcType == "1500") {
    //             timeStr1Split = CSVdata[i][1].split("-");
    //             timeStr2Split = CSVdata[i][2].split(":");
    //             var timeStrSplitSecMs = timeStr2Split[2].split(".");
    //             timeStamp = new Date(
    //                 Date.UTC(
    //                     timeStr1Split[0],	// year
    //                     timeStr1Split[1],	// month,
    //                     timeStr1Split[2],	// day,
    //                     timeStr2Split[0],	// hours,
    //                     timeStr2Split[1],	// minutes,
    //                     timeStrSplitSecMs[0],	// seconds,
    //                     timeStrSplitSecMs[1] 	// milliseconds
    //                 )
    //             );
    //         }
    //         else if (plcType == "1200") {
    //             timeStr1Split = CSVdata[i][1].split("/");//split date which is index number 1 in the array which is second element
    //             timeStr2Split = CSVdata[i][2].split(":");//splits UTC time which is index number 2 in the array which is third element
    //             timeStamp = new Date(
    //                 Date.UTC(
    //                     timeStr1Split[2],	// year
    //                     timeStr1Split[1],	// month,
    //                     timeStr1Split[0],	// day,
    //                     timeStr2Split[0],	// hours,
    //                     timeStr2Split[1],	// minutes,
    //                     timeStr2Split[2],	// seconds,
    //                     0 	// milliseconds
    //                 )
    //             );
    //         }
    //         CSVdata[i][1] = timeStamp.getTime();
    //         // Values convert to float
    //         for (var x = 3; x < CSVdata[i].length; x++) {//from third element in each line upwards, the numbers are converted to float
    //             CSVdata[i][x] = parseFloat(CSVdata[i][x]).toFixed(2); //[i]is row number and [x] is column number
    //         }

    //     }

    //     console.info("CSV Data");
    //     console.log(CSVdata);
    //     var specificColarray;
    //     var specificCol = whichValue;
    //     for (var j = 0; j < CSVdataCustomLength; j++) {
    //         specificColarray[j] = CSVdata[j][specificCol];
    //     }
    //     console.info("specific Column");
    //     console.log(specificColarray);
    //     //convertion of data in the right format for the graph template, sort the date if not chronological
    //     var dataArray = [];
    //     // colum
    //     for (var colum = 0; colum < CSVheader.length; colum++) {
    //         var dataArrayVal = [];
    //         var position = 0;
    //         // line
    //         for (var line = 0; line < CSVdata.length - 2; line++) {
    //             var seqNo = CSVdata[line][0];
    //             if (line > 0) {
    //                 if (seqNo > CSVdata[line - 1][0]) {
    //                     position = position + 1;
    //                 }
    //                 else //data is not chronological => sort it
    //                 {
    //                     position = 0;
    //                     for (var a = line - 1; a >= 0; a--) {
    //                         var tempPos = (CSVdata.length - 2) - line + a;
    //                         dataArrayVal[tempPos] = dataArrayVal[a];
    //                     }
    //                 }
    //             }

    //             var timeStamp = line;

    //             timeStamp = CSVdata[line][1];
    //             var value = parseFloat(CSVdata[line][colum + 3]);

    //             dataArrayVal[position] = [timeStamp, value];
    //         }
    //         dataArray[colum] = dataArrayVal;
    //     }


    //     console.info("Data Array");
    //     console.log(dataArray);
    //     console.log(dataArray[0][0][0]);

    //     // save data in dataSet and define graph-properties 
    //     var dataSet = [];
    //     for (var x = 0; x < 4; x++) {
    //         dataSet[x] =
    //             {
    //                 label: CSVheader[x],
    //                 data: dataArray[x],
    //                 lines: { show: true, fill: false, steps: false },
    //                 points: { show: false }
    //             };
    //     }

    //     console.info("Data Set");
    //     console.log(dataSet);

    //     //load the graph 
    //     $.plot("#graph-placeholder", dataSet,
    //         {
    //             xaxis: {
    //                 mode: "time",
    //                 min: dataArray[0][0][0]
    //             }
    //         }
    //     );
    // }
    // $.init();
});
// _____Don't add lines below this line to stay inside the onready scope!!!_________