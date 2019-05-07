
    var MagCount = 0;
    var imgClicked = 0;
    function imgClickedf() {
        imgClicked += 1;
        console.log(imgClicked);
    }
    function Mag() {
        MagCount += 1;
        console.log(MagCount);
        if (MagCount == 7 && imgClicked == 1) {
            incantation();
        }
        function speechListener() {
            window.SpeechRecognition =
                window.SpeechRecognition || window.webkitSpeechRecognition;
    
            const recognition = new SpeechRecognition();
            recognition.lang = "en-US";
    
            recognition.addEventListener("end", recognition.start);
    
            recognition.addEventListener("result", e => {
                const res = Array.from(e.results).map(result => result[0].transcript.toLowerCase());
                console.log(res);
                if (res == "obliviate" || res == "mischief managed") {
                    document.querySelector(".grid-container").classList.add("obliviate");
                } else if (res == "lumos" || res == "alohomora" || res == "i solemnly swear that i am up to no good") {
                    document.querySelector(".grid-container").classList.remove("obliviate");
                } else if (res == "avada kedavra") {
                    cursed();
                } else if (res == "expecto patronum") {
                    heal();
                } else if (res == "protego") {
                    speechListener().stop();
                    MagCount = 0;
                }
            });
    
            recognition.start();
        }
    
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
    
        function incantation() {
            speechListener();
        }
    }

// ____________Don't add lines beyond this line