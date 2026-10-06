#!/usr/bin/env python3
"""Generate built-in audio with Piper (open-source neural TTS, runs offline, no account needed).

Output matches scripts/generate-audio.mjs (Azure): web/audio/<lang>-<f|m>/<key>.mp3 plus web/audio/index.json.
Requires: pip install piper-tts; ffmpeg; the voice models downloaded into ./voices
  python -m piper.download_voices --download-dir voices <model names below>
Usage: python3 scripts/generate-audio-piper.py [--force]
"""
import hashlib, json, os, subprocess, sys, tempfile, urllib.request, wave
from piper import PiperVoice
from piper.config import SynthesisConfig

OUT = "web/audio"
VOICE_DIR = os.environ.get("PIPER_VOICE_DIR", "voices")
FORCE = "--force" in sys.argv

# slot: (model, speaker or None, label). Genders were confirmed by measured voice pitch
# (female 180–280 Hz, male 105–151 Hz); every Google Nepali speaker is female, Chitwan is male.
VOICES = {
    "de-f": ("de_DE-kerstin-low", None, "Kerstin"),
    "de-m": ("de_DE-thorsten-high", None, "Thorsten"),
    "en-f": ("en_GB-cori-high", None, "Cori"),
    "en-m": ("en_GB-alan-medium", None, "Alan"),
    "ne-f": ("ne_NP-google-medium", "0546", "Nepali female"),
    "ne-m": ("ne_NP-chitwan-medium", None, "Chitwan"),
}
LENGTH = {"-10%": 1.12, "-5%": 1.05}  # slightly slower than default, for learners
FILTER = ("silenceremove=start_periods=1:start_threshold=-50dB,areverse,"
          "silenceremove=start_periods=1:start_threshold=-50dB,areverse,"
          "apad=pad_dur=0.15,loudnorm=I=-18:TP=-1.5:LRA=11")


def sha(s):
    return hashlib.sha1(s.encode()).hexdigest()[:16]


def model_card(model):
    lang, name, quality = model.split("-", 2)
    url = f"https://huggingface.co/rhasspy/piper-voices/resolve/main/{lang.split('_')[0]}/{lang}/{name}/{quality}/MODEL_CARD"
    try:
        return urllib.request.urlopen(url, timeout=20).read().decode().strip()
    except Exception as e:  # credits are best effort
        return f"(model card unavailable: {e})"


def main():
    jobs = json.loads(subprocess.check_output(["node", "scripts/audio-jobs.mjs"]))
    hashes_path = f"{OUT}/hashes.json"
    hashes = {} if FORCE or not os.path.exists(hashes_path) else json.load(open(hashes_path))
    total = 0
    for slot, (model, spk, label) in VOICES.items():
        lang = slot.split("-")[0]
        os.makedirs(f"{OUT}/{slot}", exist_ok=True)
        voice = PiperVoice.load(f"{VOICE_DIR}/{model}.onnx")
        sid = (voice.config.speaker_id_map or {}).get(spk) if spk else None
        if spk and sid is None:
            sys.exit(f"Speaker {spk} not found in {model}")
        done = 0
        for j in jobs[lang]:
            h = sha(f"piper|{model}|{spk}|{j['rate']}|{j['text']}")
            path = f"{OUT}/{slot}/{j['key']}.mp3"
            if hashes.get(f"{slot}/{j['key']}") == h and os.path.exists(path):
                continue
            with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
                wav_path = tmp.name
            with wave.open(wav_path, "wb") as w:
                voice.synthesize_wav(j["text"], w, syn_config=SynthesisConfig(speaker_id=sid, length_scale=LENGTH[j["rate"]]))
            subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", wav_path, "-af", FILTER,
                            "-ac", "1", "-ar", "24000", "-b:a", "48k", path], check=True)
            os.unlink(wav_path)
            hashes[f"{slot}/{j['key']}"] = h
            done += 1
        total += done
        print(f"{slot}: {model}{'#' + spk if spk else ''} – {done} new files")

    index = {"engine": "piper", "voices": {}, "labels": {}, "files": {}}
    for slot, (model, spk, label) in VOICES.items():
        keys = {j["key"] for j in jobs[slot.split("-")[0]]}
        for f in os.listdir(f"{OUT}/{slot}"):
            k = f[:-4]
            if k not in keys:
                os.unlink(f"{OUT}/{slot}/{f}")
                hashes.pop(f"{slot}/{k}", None)
        index["voices"][slot] = model + (f"#{spk}" if spk else "")
        index["labels"][slot] = label
        index["files"][slot] = sorted(k for k in keys if os.path.exists(f"{OUT}/{slot}/{k}.mp3"))
    json.dump(index, open(f"{OUT}/index.json", "w"), ensure_ascii=False)
    json.dump(hashes, open(hashes_path, "w"), indent=1)

    with open(f"{OUT}/CREDITS.md", "w") as c:
        c.write("# Voice credits\n\nBuilt-in audio is synthesised with [Piper](https://github.com/OHF-Voice/piper1-gpl) "
                "using these voice models. Their model cards (source data and licence) follow.\n")
        for slot, (model, spk, label) in VOICES.items():
            c.write(f"\n## {slot}: {label} – `{model}`{' speaker ' + spk if spk else ''}\n\n```\n{model_card(model)}\n```\n")
    print(f"Done: {total} new files.")


if __name__ == "__main__":
    main()
