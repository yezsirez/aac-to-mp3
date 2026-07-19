import express from "express";
import multer from "multer";
import ffmpeg from "fluent-ffmpeg";
import ffmpegPath from "ffmpeg-static";
import fs from "fs";
import path from "path";
import os from "os";
import cors from "cors";

ffmpeg.setFfmpegPath(ffmpegPath);

const app = express();
app.use(cors());

const upload = multer({
    storage: multer.memoryStorage()
});

app.post("/convert", upload.single("file"), async (req, res) => {

    if (!req.file)
        return res.status(400).send("No file.");

    const input = path.join(os.tmpdir(), Date.now() + ".aac");
    const output = path.join(os.tmpdir(), Date.now() + ".mp3");

    fs.writeFileSync(input, req.file.buffer);

    ffmpeg(input)
        .audioCodec("libmp3lame")
        .audioBitrate(192)
        .format("mp3")
        .save(output)
        .on("end", () => {

            res.download(output, "output.mp3", () => {
                fs.unlinkSync(input);
                fs.unlinkSync(output);
            });

        })
        .on("error", err => {
            console.error(err);

            if (fs.existsSync(input))
                fs.unlinkSync(input);

            if (fs.existsSync(output))
                fs.unlinkSync(output);

            res.status(500).send(err.message);
        });

});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log("Running on port", PORT);
});
