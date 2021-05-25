const axios = require("axios");
const fs = require("fs");
const googleTTS = require("google-tts-api");
const player = require("play-sound")({ player: "mplayer" });

const URL =
    "https://cdn-api.co-vin.in/api/v2/appointment/sessions/calendarByPin?pincode=560011&date=24-05-2021&vaccine=COVAXIN";

const syncPlay = () => {
    let childProcess = player.play(`${soundUrlArr[i]}.mp3`, (err) => {
        if (err) {
            console.log(err);
        }
    });
    childProcess.on("close", () => {
        if (i < soundUrlArr.length) {
            i++;
            syncPlay();
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

const startApp = () => {
    axios
        .get(
            "https://cdn-api.co-vin.in/api/v2/appointment/sessions/calendarByDistrict?district_id=294&date=26-05-2021",
            {
                headers: {
                    "user-agent":
                        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/56.0.2924.87 Safari/537.36",
                    // Authorization:
                    //     "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX25hbWUiOiJkOGEwZTZhYy1iZTQ3LTRlY2YtODNlMS0zZDJmMTE3ZjU2MjMiLCJ1c2VyX2lkIjoiZDhhMGU2YWMtYmU0Ny00ZWNmLTgzZTEtM2QyZjExN2Y1NjIzIiwidXNlcl90eXBlIjoiQkVORUZJQ0lBUlkiLCJtb2JpbGVfbnVtYmVyIjo5NzQxNDE1MjQ2LCJiZW5lZmljaWFyeV9yZWZlcmVuY2VfaWQiOjYzMzAyMzYyNTI0MTEwLCJzZWNyZXRfa2V5IjoiYjVjYWIxNjctNzk3Ny00ZGYxLTgwMjctYTYzYWExNDRmMDRlIiwidWEiOiJNb3ppbGxhLzUuMCAoV2luZG93cyBOVCAxMC4wOyBXaW42NDsgeDY0KSBBcHBsZVdlYktpdC81MzcuMzYgKEtIVE1MLCBsaWtlIEdlY2tvKSBDaHJvbWUvOTAuMC40NDMwLjIxMiBTYWZhcmkvNTM3LjM2IiwiZGF0ZV9tb2RpZmllZCI6IjIwMjEtMDUtMjRUMDc6MjQ6NDUuNTg2WiIsImlhdCI6MTYyMTg0MTA4NSwiZXhwIjoxNjIxODQxOTg1fQ.a5yERm8jQB30pOm1f6yPhv1lTomEZYoXWB9UBjbVEgw",
                },
            }
        )
        .then((response) => {
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
                        let fileData = fs.readFileSync(
                            `./slotsData/${outputFileName}`,
                            {
                                encoding: "utf-8",
                            }
                        );

                        let existingData = JSON.parse(fileData);
                        existingData.push({
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
                        fs.writeFileSync(
                            `./slotsData/${outputFileName}`,
                            JSON.stringify(existingData, null, 4)
                        );
                    }
                });
            });
            if (soundUrlArr.length === 0) {
                soundUrlArr.push(getSoundUrl("No slots available"));
            }
            syncPlay();
        })
        .catch((err) => {
            console.log(err);
        });
};

// setInterval(() => {
//     let soundUrlArr = [];
// let i = 0;
//     let outputFileName =
//         new Date().toLocaleDateString().split("/").join("-") +
//         " " +
//         new Date().toLocaleTimeString().split(":").join("-") +
//         ".json";

//     fs.writeFileSync(`./slotsData/${outputFileName}`, JSON.stringify([]));

//     startApp();
// }, 60000);

let soundUrlArr = [];
let i = 0;

let outputFileName =
    new Date().toLocaleDateString().split("/").join("-") +
    " " +
    new Date().toLocaleTimeString().split(":").join("-") +
    ".json";

fs.writeFileSync(`./slotsData/${outputFileName}`, JSON.stringify([]));

startApp();
