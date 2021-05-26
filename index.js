const axios = require("axios");
const fs = require("fs");
const googleTTS = require("google-tts-api");
const player = require("play-sound")({ player: "mplayer" });

const API_HIT_INTERVAL = 60000;

const syncPlay = (soundUrlArr, i, startTime) => {
    let elapsedTime = new Date() - startTime;
    let childProcess = player.play(`${soundUrlArr[i]}.mp3`, (err) => {
        if (err) {
            console.log(err);
        }
    });
    childProcess.on("close", () => {
        if (i < soundUrlArr.length && elapsedTime < API_HIT_INTERVAL - 1000) {
            syncPlay(soundUrlArr, i + 1, startTime);
        } else {
            return false;
        }
    });
    childProcess.on("error", () => {
        console.log("Error playing audio");
    });
};

const getSoundUrl = (text) => {
    const soundUrl = googleTTS.getAudioUrl(text, {
        lang: "en",
        slow: false,
        host: "https://translate.google.com",
    });
    return soundUrl;
};

const getFormattedDate = () => {
    let date = new Date();
    let dateStr = `${date.getDate()}-${
        date.getMonth() + 1
    }-${date.getFullYear()}`;
    return dateStr;
};

const writeSlotsDataToFile = (data) => {
    let outputFileName =
        getFormattedDate() +
        " " +
        new Date().toLocaleTimeString().split(":").join("-") +
        ".json";
    if (data.length > 0) {
        fs.writeFileSync(
            `./slotsData/${outputFileName}`,
            JSON.stringify(data, null, 4)
        );
    } else {
        console.log(`${outputFileName} was not created as no slots were found`);
    }
};

const URL = `https://cdn-api.co-vin.in/api/v2/appointment/sessions/public/calendarByDistrict?district_id=294&date=${getFormattedDate()}`;

const startApp = () => {
    axios
        .get(URL, {
            headers: {
                Accept: "application/json, text/plain, */*",
                "Accept-Encoding": "gzip, deflate, br",
                "Accept-Language": "en-US,en;q=0.9,kn;q=0.8",
                dnt: 1,
                Host: "cdn-api.co-vin.in",
                Origin: "https://www.cowin.gov.in,",
                Referer: "https://www.cowin.gov.in/",
                "sec-ch-ua": `" Not A;Brand";v="99", "Chromium";v="90", "Google Chrome";v="90"`,
                "Sec-Fetch-Site": "cross-site",
                "Sec-Fetch-Mode": "cors",
                "User-Agent":
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.212 Safari/537.36",
            },
        })
        .then((response) => {
            let slotsData = [];
            let soundUrlArr = [];
            let data = response.data.centers;
            data.map((item) => {
                let sessions = item.sessions;
                sessions.map(async (session) => {
                    if (
                        session.vaccine === "COVAXIN" &&
                        session.available_capacity_dose2 > 0 &&
                        session.min_age_limit === 45 &&
                        session.available_capacity > 0
                    ) {
                        soundUrlArr.push(
                            getSoundUrl(
                                `${
                                    session.available_capacity
                                } slots opened in ${
                                    item.name
                                } for ${session.vaccine.toLowerCase()}`
                            )
                        );

                        slotsData.push({
                            name: item.name,
                            address: item.address,
                            pincode: item.pincode,
                            vaccine: session.vaccine,
                            capacity_for_dose1:
                                session.available_capacity_dose1,
                            capacity_for_dose2:
                                session.available_capacity_dose2,
                            age_limit: session.min_age_limit,
                        });
                    }
                });
            });
            if (soundUrlArr.length === 0) {
                soundUrlArr.push(getSoundUrl("No slots available"));
            }
            writeSlotsDataToFile(slotsData);
            let startTime = new Date();
            syncPlay(soundUrlArr, 0, startTime);
        })
        .catch((err) => {
            console.log(err);
        });
};

setInterval(() => {
    startApp();
}, API_HIT_INTERVAL);
startApp();
