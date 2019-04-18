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
    // Button elements
    var v12_button = document.getElementById("v12");
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
        'EnergyOutGenerated': 0,
        'StartAddress': 40001,
        'DataLength': 2,
        'TestPeriod': 5,
        'DutyCycle': 10
    };
    var ValueToBePlotted = ccObject.BusInCurrent;
    var plotText = "Bus In Current";
    var smoothie1 = new SmoothieChart({ responsive: true, minValue: 0, title: { text: 'Bus Voltage', fillStyle: '#ffffff', fontSize: 15, fontFamily: 'sans-serif', verticalAlign: 'top' } });
    smoothie1.streamTo(document.getElementById("mycanvas1"));
    var line1 = new TimeSeries();
    smoothie1.addTimeSeries(line1, { strokeStyle: 'rgb(0, 255, 0)', fillStyle: 'rgba(0, 255, 0, 0.4)', lineWidth: 3 });
    var smoothie2 = new SmoothieChart({ responsive: true, title: { text: plotText, fillStyle: '#ffffff', fontSize: 15, fontFamily: 'sans-serif', verticalAlign: 'top' } });
    smoothie2.streamTo(document.getElementById("mycanvas2"));
    var line2 = new TimeSeries();
    smoothie2.addTimeSeries(line2, { strokeStyle: 'rgb(0, 255, 0)', fillStyle: 'rgba(0, 255, 0, 0.4)', lineWidth: 3 });
    //    ______________Initialisation Done____________
    // _________________________________\/ \/ \/On Click \/ \/ \/ _______________
    PlotControlButtons.addEventListener("click", changeGraph, false);
    var ccObjectIndex;
    function changeGraph(e) {
        if (e.target !== e.currentTarget) {
            e.target.value = 1;
            ccObjectIndex = e.target.id;
            ValueToBePlotted = ccObject[e.target.id];
            smoothie2.options.title.text = e.target.innerHTML;
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
    var start_time = new Date().getTime();
    var interval = null;
    var request_time = null;
    var intervalDuration = 100;
    // var xhr = new XMLHttpRequest();
    function intervalFunction() {
        start_time = new Date().getTime();
        $.ajax({
            url: "Data.json",
            dataType: 'json',
            type: "get",
            cache: false,
            success: function (data) {
                ccObject = data;
                request_time = new Date().getTime() - start_time;
                document.querySelector("#RequestTime").textContent = `Request time: ${request_time}`;
            }
        });
        // start_time = new Date().getTime();
        // xhr.open('get', 'Data.json');
        // xhr.send();
        line1.append(new Date().getTime(), ccObject.BusVoltage);
        if (ccObjectIndex == "BusOutCurrent") {
            ValueToBePlotted = -((~ccObject[ccObjectIndex] & ((2 ^ 16) - 1)) + 1);
        }
        line2.append(new Date().getTime(), ccObject[ccObjectIndex]);
        // console.log(ccObject);
        document.querySelector('#CreateCurrentValue').innerHTML = "Current Value: " + ccObject.CreateLog;
        document.querySelector('#OpenCurrentValue').innerHTML = "Current Value: " + ccObject.OpenLog;
        document.querySelector('#ClearCurrentValue').innerHTML = "Current Value: " + ccObject.ClearLog;
        document.querySelector('#DeleteCurrentValue').innerHTML = "Current Value: " + ccObject.DeleteLog;
        document.querySelector('#WritingCommandCurrentValue').innerHTML = "Current Value: " + ccObject.StartWriteLog;
        // if (ccObject.ReadTrig == 0) {
        //     document.querySelector('#ReadingCurrentValue').innerHTML("Status: Reading is OFF");
        // } else {
        //     document.querySelector('#ReadingCurrentValue').innerHTML("Status: Reading is ON");
        // }
        // Data Address and Data length Control
        document.querySelector('#startAddressCurrentValue').innerHTML = "Current Value: " + ccObject.StartAddress;
        // Timers Control for reading Modbus data (Req freq.)
        document.querySelector('#TestPeriodCurrentValue').innerHTML = "Current Value: " + ccObject.TestPeriod;
        document.querySelector('#DutyCycleCurrentValue').innerHTML = "Current Value: " + ccObject.DutyCycle;
    }
    // xhr.onload = function () {
    //     request_time = new Date().getTime() - start_time;
    //     document.querySelector("#RequestTime").textContent = `Request time: ${request_time}`;
    //     if (this.status == 200) {
    //         try {
    //             ccObject = JSON.parse(this.responseText);
    //         } catch (e) {
    //             console.warn("There was an error in the JSON. Could not parse!");
    //         }
    //     } else {
    //         console.warn("did not receive 200 OK from server!")
    //     }
    // }
    // __________Stop interval when pressed
    document.querySelector("#ClearInterval").onclick = function () {
        clearInterval(interval);
    }
    document.querySelector("#StartInterval").onclick = function () {
        clearInterval(interval);
        intervalDuration = document.querySelector("#intervalInput").value;
        interval = setInterval(intervalFunction, intervalDuration);
    }
    $("#LogCreateButton").click(function (e) {
        url = "Outputs.htm";
        name = 'DB16.DBX0.0';
        sdata = escape(name) + '=1';
        $.post(url, sdata, function () {
            sdata = escape(name) + '=0';
            $.post(url, sdata);
        });
    });
    $("#LogOpenButton").click(function (e) {
        url = "Outputs.htm";
        name = 'DB16.DBX0.1';
        sdata = escape(name) + '=1';
        $.post(url, sdata, function () {
            sdata = escape(name) + '=0';
            $.post(url, sdata);
        });
    });
    $("#LogClearButton").click(function (e) {
        url = "Outputs.htm";
        name = 'DB16.DBX0.2';
        sdata = escape(name) + '=1';
        $.post(url, sdata, function () {
            sdata = escape(name) + '=0';
            $.post(url, sdata);
        });
    });
    $("#LogDeleteButton").click(function (e) {
        url = "Outputs.htm";
        name = 'DB16.DBX0.3';
        sdata = escape(name) + '=1';
        $.post(url, sdata, function () {
            sdata = escape(name) + '=0';
            $.post(url, sdata);
        });
    });
    $("#LogWriteButton").click(function (e) {
        url = "Outputs.htm";
        name = 'DB16.DBX0.5';
        sdata = escape(name) + '=1';
        $.post(url, sdata, function () {
            sdata = escape(name) + '=0';
        });
    });
    $("#StartReadButton").click(function (e) {
        url = "Outputs.htm";
        name = 'DB16.DBX0.4';
        sdata = escape(name) + '=1';
        $.post(url, sdata, function () {
            sdata = escape(name) + '=0';
            $.post(url, sdata);
        });
    });
    $("#DataLengthButton").click(function () {
        url = "Outputs.htm";
        name = 'DB16.DBW2';
        val = $('input[id=DataLength]').val();
        sdata = escape(name) + '=' + val;
        $.post(url, sdata);
    });
    $("#AddressButton").click(function () {
        url = "Outputs.htm";
        name = 'DB16.DBD4';
        val = $('input[id=StartAddress]').val();
        sdata = escape(name) + '=' + val;
        $.post(url, sdata);
    });
    $("#DTButton").click(function () {
        url = "Outputs.htm";
        name = 'DB16.DBD8';
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
        // console.log(e.target.classList.contains("Tab1"));
        if (e.target.classList.contains("Tab1")) {
            console.log("I am tab1");
            document.querySelector(".MiscButtons").classList.remove("hidden");
            document.querySelector(".TestInfo").classList.add("hidden");

        }
        if (e.target.classList.contains("Tab2")) {
            console.log("I am tab2");
            document.querySelector(".MiscButtons").classList.add("hidden");
            document.querySelector(".TestInfo").classList.remove("hidden");
            // e.target.classList.toggle("hidden");
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
// _____Don't add below this line to stay inside the onready scope!!!_________