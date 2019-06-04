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
    var TestInfo = {
        title: "",
        SerialNmber: "",
        Description: ""
    }
    var cylinderStrted = 0;
    var cylinderStopped = 0;
    var DataDownloaded = 0;
    var TestisDone = 0;
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

    document.querySelector("#time").addEventListener("click", Mag, false);
    document.querySelector("img").addEventListener("click", imgClickedf, false);
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
                    smoothie2.options.title.text = e.target.innerHTML + " (A)";
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
                    url: "json/Data1.json",
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
                    url: "json/Data2.json",
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
                    url: "json/Data3.json",
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
                    url: "json/Data4.json",
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
                    url: "json/Data5.json",
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
                    url: "json/Data6.json",
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
                    url: "json/Data7.json",
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
                    url: "json/Data8.json",
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
                    url: "json/CCData.json",
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
                    url: "json/CAP.json",
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
                    url: "json/PLCControl.json",
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
                            $.post("htm/Outputs.htm", 'DB16.DBX16.5=0')
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
            case "12"://TestMode
                $.ajax({
                    url: "json/TestMode.json",
                    dataType: 'json',
                    type: "get",
                    cache: false,
                    error: function () {
                        console.warn("There has been an error with the ajax request");
                    },
                    success: function (data) {
                        ccObject = data;

                        request_time = new Date().getTime() - start_time;
                        document.querySelector("#RequestTime").textContent = `Request time: ${request_time}`;
                        line1.append(new Date().getTime(), HexToReal(ccObject.BusVoltage));
                        line2.append(new Date().getTime(), HexToReal(ccObject.BusInCurrent));
                        if (ccObject.WritingOutputState == 0 && writeRequestFlag == 1 && writingStarted == 1 && cylinderStrted == 1 && cylinderStopped == 0) { //writing finished
                            $.post("htm/Outputs.htm", 'DB16.DBX16.5=0', function () {
                                TestisDone = 1;
                                writeRequestFlag = 0;
                                document.querySelector("#lastLogisDeleted").classList.add("hidden");
                                document.querySelector("#NewRecCreated").classList.add("hidden");
                                document.querySelector("#NewRecOpened").classList.add("hidden");
                                document.querySelector("#WritingInProgress").classList.add("hidden");
                                document.querySelector("#prevSerial").innerHTML = TestInfo.SerialNmber;
                                document.querySelector("#DownloadDataLog").setAttribute("download", TestInfo.SerialNmber);
                                document.querySelector("#isDataLogDownloaded").innerHTML = "Yes/ Check Downloads directory!";
                                document.querySelector("#StartTestButton").innerHTML = "Start Test";
                                document.querySelector("#StartTestButton").removeAttribute("disabled");
                            });

                        }
                        if (TestisDone == 1 && DataDownloaded == 0 && cylinderStrted == 1) {
                            // document.querySelector("#StopCylinder").click();
                            StopCylinderfunc();
                            document.querySelector("#DownloadDataLog").click();
                            DataDownloaded = 1;
                        }
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
        url = "htm/Outputs.htm";
        name = 'DB16.DBX16.0';
        sdata = escape(name) + '=1';
        $.post(url, sdata, function () {
            sdata = escape(name) + '=0';
            $.post(url, sdata);
        });
    });
    $("#LogOpenButton").click(function (e) {
        url = "htm/Outputs.htm";
        name = 'DB16.DBX16.1';
        sdata = escape(name) + '=1';
        $.post(url, sdata, function () {
            sdata = escape(name) + '=0';
            $.post(url, sdata);
        });
    });
    $("#LogClearButton").click(function (e) {
        url = "htm/Outputs.htm";
        name = 'DB16.DBX16.2';
        sdata = escape(name) + '=1';
        $.post(url, sdata, function () {
            sdata = escape(name) + '=0';
            $.post(url, sdata);
        });
    });
    $("#LogDeleteButton").click(function (e) {
        url = "htm/Outputs.htm";
        name = 'DB16.DBX16.3';
        sdata = escape(name) + '=1';
        $.post(url, sdata, function () {
            sdata = escape(name) + '=0';
            $.post(url, sdata);
        });
    });
    $("#LogWriteButton").click(function (e) {
        url = "htm/Outputs.htm";
        name = 'DB16.DBX16.5';
        sdata = escape(name) + '=1';
        $.post(url, sdata, function () {
            writeRequestFlag = 1;
        });
    });
    $("#DataLengthButton").click(function () {
        url = "htm/Outputs.htm";
        name = 'DB16.DBW18';
        val = $('input[id=DataLength]').val();
        sdata = escape(name) + '=' + val;
        $.post(url, sdata);
    });
    $("#AddressButton").click(function () {
        url = "htm/Outputs.htm";
        name = 'DB16.DBD20';
        val = $('input[id=StartAddress]').val();
        sdata = escape(name) + '=' + val;
        $.post(url, sdata);
    });
    $("#DTButton").click(function () {
        url = "htm/Outputs.htm";
        name = 'DB16.DBD24';
        val = $('input[id=DutyCycle]').val();
        sdata = escape(name) + '=' + val;
        $.post(url, sdata);
    });
    $("#TestPeriodButton").click(function () {
        url = "htm/Outputs.htm";
        name = 'DB16.DBD28';
        val = $('input[id=TestPeriod]').val();
        sdata = escape(name) + '=' + val;
        $.post(url, sdata);
    });

    // __________________Tabs________________
    document.querySelector(".Tabs").onclick = function (e) {
        if (e.target.classList.contains("Tab1")) {
            document.querySelector(".MiscButtonsMain").style.display = "grid";
            document.querySelector(".MiscButtons").classList.remove("hidden");
            document.querySelector(".GenericButtons").classList.remove("hidden");
            document.querySelector(".CylinderButtons").classList.remove("hidden");
            document.querySelector(".TestInfo").classList.add("hidden");
            document.querySelector(".prevTest").classList.add("hidden");
            document.querySelector(".testSettings").classList.add("hidden");
            document.querySelector(".testLog").classList.add("hidden");
            document.querySelector(".nextTest").classList.add("hidden");
            document.querySelector(".testMode").style.display = "none";
            document.querySelector("#DatalogGraph").classList.add("hidden");

        }
        if (e.target.classList.contains("Tab2")) {
            document.querySelector(".MiscButtons").classList.add("hidden");
            document.querySelector(".MiscButtonsMain").style.display = "initial";
            document.querySelector(".GenericButtons").classList.add("hidden");
            document.querySelector(".CylinderButtons").classList.add("hidden");
            document.querySelector(".TestInfo").classList.add("hidden");
            document.querySelector(".prevTest").classList.add("hidden");
            document.querySelector(".testSettings").classList.add("hidden");
            document.querySelector(".testLog").classList.add("hidden");
            document.querySelector(".nextTest").classList.add("hidden");
            document.querySelector(".testMode").style.display = "none";
            document.querySelector("#DatalogGraph").classList.remove("hidden");
        }
        if (e.target.classList.contains("Tab3")) {
            document.querySelector(".MiscButtons").classList.add("hidden");
            document.querySelector(".MiscButtonsMain").style.display = "grid";
            document.querySelector(".GenericButtons").classList.add("hidden");
            document.querySelector(".CylinderButtons").classList.add("hidden");
            document.querySelector(".TestInfo").classList.remove("hidden");
            document.querySelector(".prevTest").classList.remove("hidden");
            document.querySelector(".testSettings").classList.remove("hidden");
            document.querySelector(".testLog").classList.remove("hidden");
            document.querySelector(".nextTest").classList.remove("hidden");
            document.querySelector(".testMode").style.display = "flex";
            document.querySelector("#DatalogGraph").classList.add("hidden");
        }
    }

    // Cylinder Control________________
    document.querySelector(".CylinderButtons").onclick = function (e) {
        if (e.target.id == "StopCylinder") {
            $.post("htm/Outputs.htm", 'DB22.DBX0.2=0', function () {
                $.post("htm/Outputs.htm", 'DB22.DBX0.3=0', function () {
                    $.post("htm/Outputs.htm", 'DB22.DBX0.1=0');
                    $.post("htm/Outputs.htm", 'DB22.DBX0.3=1')
                    console.log("Stopped")
                    cylinderStopped = 1;
                })
            })
        } else if (e.target.id == "StartCylinder") {
            $.post("htm/Outputs.htm", 'DB22.DBX0.2=0', function () {
                $.post("htm/Outputs.htm", 'DB22.DBX0.3=0', function () {
                    $.post("htm/Outputs.htm", 'DB22.DBX0.1=1');
                    console.log("Started")
                    cylinderStrted = 1;
                })
            })
        } else if (e.target.id == "OpenCylinder") {
            $.post("htm/Outputs.htm", 'DB22.DBX0.1=0', function () {
                $.post("htm/Outputs.htm", 'DB22.DBX0.3=0', function () {
                    $.post("htm/Outputs.htm", 'DB22.DBX0.2=1');
                    console.log("Opened")
                })
            })
        } else if (e.target.id == "CloseCylinder") {
            $.post("htm/Outputs.htm", 'DB22.DBX0.1=0', function () {
                $.post("htm/Outputs.htm", 'DB22.DBX0.2=0', function () {
                    $.post("htm/Outputs.htm", 'DB22.DBX0.3=1');
                    console.log("Closed")
                })
            })
        }
    }
    function StopCylinderfunc() {
        $.post("htm/Outputs.htm", 'DB22.DBX0.2=0', function () {
            $.post("htm/Outputs.htm", 'DB22.DBX0.3=0');
            $.post("htm/Outputs.htm", 'DB22.DBX0.1=0');
            $.post("htm/Outputs.htm", 'DB22.DBX0.3=1');
            console.log("Stopped");
            cylinderStopped = 1;
            cylinderStrted = 0;
        });
    }
    document.querySelector("#TestModeButton").onclick = function () {
        this.innerHTML = "Test Mode is ON";
        this.style.background = "lightgreen";
        $.post("htm/Outputs.htm", 'DB16.DBD28=120000'); //set test period to 2 s
        requestIdentifier = "12";
        smoothie2.options.title.text = "Bus In Current (A)";
        line1.clear();
        line2.clear();
        smoothie1.start();
        smoothie2.start();
        clearFlag = 0;
        interval = setTimeout(intervalFunction, 10);
    }
    //Start Test Button________________________Start Test Button______________
    document.querySelector("#StartTestButton").onclick = function () {
        TestisDone = 0;
        DataDownloaded = 0;
        writeRequestFlag = 1;
        cylinderStrted = 0;
        cylinderStopped = 0;
        writingStarted = 0;
        TestInfo.SerialNmber = document.querySelector("#SerialNumberInput").value;
        $.post("htm/Outputs.htm", 'DB16.DBX16.3=1', function () {       //Delete record
            $.post("htm/Outputs.htm", 'DB16.DBX16.3=0', function () {   //reset delete record trigger
                document.querySelector("#lastLogisDeleted").classList.remove("hidden"); //declare deleted
                $.post("htm/Outputs.htm", 'DB16.DBX16.0=1', function () { //create record
                    $.post("htm/Outputs.htm", 'DB16.DBX16.0=0', function () { // reset create record trigger
                        document.querySelector("#NewRecCreated").classList.remove("hidden");//declare Created
                        document.querySelector("#NewRecOpened").classList.remove("hidden");//declare Opened
                        $.post("htm/Outputs.htm", 'DB22.DBX0.1=1', function () {//start cylinder
                            cylinderStrted = 1;
                            $.post("htm/Outputs.htm", 'DB16.DBX16.5=0', function () {//reset trigger for writing
                                $.post("htm/Outputs.htm", 'DB16.DBX16.5=1', function () { //start writing
                                    writingStarted = 1;
                                    document.querySelector("#WritingInProgress").classList.remove("hidden");
                                    document.querySelector("#StartTestButton").setAttribute("disabled", "disabled");
                                    document.querySelector("#StartTestButton").innerHTML = "Test In Progress";

                                })
                            })
                        })

                    })
                })
            })
        })
    }

    //Cancel Test button
    document.querySelector("#CancelTestButton").onclick = function () {
        TestisDone = 0;
        DataDownloaded = 0;
        writeRequestFlag = 0;
        $.post("htm/Outputs.htm", 'DB16.DBX16.5=0', function () {//reset writing trigger
            console.log("Writing Trigger reset");
            $.post("htm/Outputs.htm", 'DB16.DBX32.0=1', function () {//Reset writing timer
                console.log("Writing timer reset");
                $.post("htm/Outputs.htm", 'DB16.DBX32.0=0');
            })
            console.log("Test Cancelled");
        })
        document.querySelector("#lastLogisDeleted").classList.add("hidden");
        document.querySelector("#NewRecCreated").classList.add("hidden");
        document.querySelector("#NewRecOpened").classList.add("hidden");
        document.querySelector("#WritingInProgress").classList.add("hidden");
        document.querySelector("#prevSerial").innerHTML = TestInfo.SerialNmber;
        document.querySelector("#DownloadDataLog").setAttribute("download", TestInfo.SerialNmber);
        document.querySelector("#isDataLogDownloaded").innerHTML = "Yes";
        document.querySelector("#StartTestButton").innerHTML = "Start Test";
        document.querySelector("#StartTestButton").removeAttribute("disabled");
        // document.querySelector("#StopCylinder").click();
        StopCylinderfunc();
    }
});
// _____Don't add lines below this line (to stay inside the onready scope)