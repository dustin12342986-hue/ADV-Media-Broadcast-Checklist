/* ===========================================================================
   BLUE BONNET — GEAR KNOWLEDGE BASE
   Allen & Heath SQ-5 console + Shure ULX-D digital wireless
   ===========================================================================

   HOW TO USE THIS FILE

   Paste the GEAR_KB constant below into your CURRENT blue-bonnet-widget.js,
   right after the existing CREW_KB constant. Then add it to whatever string
   you send as the system prompt, e.g.:

       const SYSTEM = CREW_KB + "\n\n" + GEAR_KB;

   It is deliberately a separate constant so it can be updated without
   touching the crew/schedule knowledge, and so it can be dropped into other
   Blue Bonnet apps that need the same gear reference.

   WHAT THIS IS AND ISN'T

   This is an operating reference for the two boxes, written for someone
   standing in front of them mid-show. It is not the manufacturer's manual
   and doesn't reproduce one — those are copyrighted, and they're also far
   too long to sit in a system prompt. Everything here is grounded in the
   official documentation, and both manuals are linked below so the assistant
   can point people at the real thing for anything deeper:

     SQ-5   https://www.allen-heath.com/hardware/sq/sq-5/
     ULX-D  https://pubs.shure.com/guide/ULXD        (single)
            https://pubs.shure.com/guide/ULXD-DQ     (dual / quad)

   IMPORTANT: verify the frequency-band and channel-count lines against the
   actual units in your racks before trusting them on a show. ULX-D ships in
   several bands and the receivers come in 1/2/4 channel versions — I don't
   know which ones ADV owns, so those are described generally.
   =========================================================================== */

const GEAR_KB = `
=== AUDIO GEAR REFERENCE ===

--------------------------------------------------
ALLEN & HEATH SQ-5 DIGITAL CONSOLE
--------------------------------------------------

WHAT IT IS
Rack-mountable 48-channel digital mixer, 96kHz XCVI FPGA core, under 0.7ms
latency with all processing running. 19" rackmountable.

PHYSICAL I/O (on the console itself)
- 16 local mic/line inputs, XLR, with onboard preamps
- 2 stereo inputs on 1/4" TRS (ST1, ST2), 1 stereo on 3.5mm mini jack (ST3)
- 14 assignable local outputs: 12 XLR + 2 on 1/4" TRS
- AES digital output
- Dedicated talkback mic input (XLR)
- 1/4" TRS headphone out with its own level control
- SLink port (EtherCON) — expands to 48 mic inputs total using dSnake, DX or
  gigaACE stage boxes
- I/O Port for an option card (Dante, Waves, MADI and similar)
- USB-B: 32x32 audio interface to a computer
- SQ-Drive: direct multitrack recording to a USB drive
- Power: 100-240V AC, 50/60Hz

CHANNEL COUNT AND BUSES
- 48 input channels total
- 12 stereo mixes (each usable as aux or group) + main LR
- 3 stereo matrix
- 36 buses total, plus the PAFL bus
- 8 stereo FX engines with dedicated return channels (RackExtra library)

PROCESSING — EVERY input channel has all of this, always:
- High pass filter
- Gate with sidechain and filter
- 4-band parametric EQ with RTA
- Peak/RMS compressor
Every mix has parametric EQ, a 28-band graphic EQ, and a compressor.

SURFACE
16+1 motorized faders across 6 layers. 7" capacitive touchscreen with
illuminated encoders around it — touch something on screen and it lands on
the encoders. 8 assignable SoftKeys. Channels and mixes can be dragged to any
strip, with custom names and colour coding on the strip displays.

PREAMP NUMBERS
- Analogue gain 0dB to +60dB in 1dB steps
- Switchable -20dB pad
- Input sensitivity -60 to +0dBu, max input +30dBu
- Phantom power +48V, switchable per channel

AUTOMATIC MIC MIXING (AMM)
Built in, no added latency. This is the feature to reach for on announcer
positions, panels and anything with several open mics — it ducks the mics
that aren't being spoken into so the open-mic count doesn't build up noise.

REMOTE CONTROL
- SQ MixPad — full wireless control from iOS, Android or Mac
- SQ4You — personal monitor mixing from a performer's own phone
- Compatible with the ME personal mixing system over SLink

BROADCAST-SPECIFIC NOTES FOR ADV
- SQ-Drive is the fastest way to get a multitrack safety recording of a show.
- The 32x32 USB interface is how you'd feed a laptop for streaming or
  post-production without extra converters.
- AES out is the clean way into a broadcast chain if the downstream gear
  takes digital.

--------------------------------------------------
SHURE ULX-D DIGITAL WIRELESS
--------------------------------------------------

WHAT IT IS
Digital wireless system. 24-bit / 48kHz audio, 20Hz-20kHz, greater than
120dB dynamic range. AES-256 encryption available.

COMPONENTS
- ULXD4 — single-channel receiver, half rack
- ULXD4D — dual-channel receiver
- ULXD4Q — quad-channel receiver
  (All three behave the same; they differ in channel count and how many audio
  outputs they have.)
- ULXD1 — bodypack transmitter
- ULXD2 — handheld transmitter

Receivers have XLR and 1/4" outputs with a mic/line switch, two antenna
connectors (A and B), an Ethernet port, and a 15V DC power input. ULXD4 uses
the 15V DC supply that ships with it.

SETUP ORDER — do it in this order every time
1. Attach both antennas. Keep them away from metal and other RF sources.
2. Connect power, then connect audio out to the console.
3. Scan for and deploy frequencies (see below).
4. Put batteries in the transmitters — Shure SB900-series rechargeables or AAs.
5. Power on the transmitters.
6. IR sync each transmitter to its receiver channel.

FREQUENCY SCAN
On the receiver: SCAN > GROUP SCAN. When it finishes it shows the group with
the most open frequencies. Press the flashing ENTER to deploy frequencies to
each receiver channel.

IR SYNC — this is what pairs a transmitter to a channel
1. Power on the transmitter.
2. Press the sync button on the receiver.
3. Hold the transmitter's IR window up to the receiver's until the receiver's
   IR port glows red.
4. "SYNC SUCCESS!" appears. Both are now on the same frequency.

MULTIPLE RECEIVERS
Networking them over Ethernet is the fastest way to distribute clean channels.
All networked receivers must be in the SAME frequency band. Turn on every
receiver, run a group scan on the first one, and let it deploy across the
network. Sync a transmitter to each channel, and leave each one powered on as
you work through them — a transmitter that's off doesn't hold its frequency
in the coordination.

GAIN STAGING
Front panel gain on the receiver goes up to 60dB. Set the rear output level
(mic vs line, XLR output) to match what the console input expects. On the SQ-5
that normally means line level into a channel with the pad engaged or gain
backed well off.

THINGS THAT LOOK BROKEN BUT AREN'T
- No audio at all: the receiver will not pass audio unless at least one blue
  RF LED is lit. No blue LED means it isn't hearing the transmitter.
- Distorting even with gain down: set MIC.OFFSET to 0dB, and if it still
  clips, pad the source itself.
- Screen says LOCKED: the lock feature is on. Transmitters and receivers can
  both be locked to stop accidental changes mid-show.
- RF MUTED on power-up: someone held the exit button while powering on.
  Restart the transmitter to clear it.
- Transmitter shut itself down: ULX-D transmitters shut down if the battery
  overheats and doesn't cool.
- Changed encryption on or off: you must re-sync the receiver and transmitter
  afterwards or they won't talk.

TROUBLESHOOTING CHECKLIST, IN ORDER
1. Is the receiver getting proper voltage from its own 15V supply?
2. Battery level on the transmitter?
3. Is a blue RF LED lit?
4. Receiver gain set, and output level (mic/line) matched to the console?
5. Cables and connectors physically good?

COORDINATION SOFTWARE
Wireless Workbench 6 (free from Shure) handles frequency coordination across
multiple systems and shows interference alerts. Worth running at a venue with
heavy RF — a stadium with press, officials and school systems all live.

--------------------------------------------------
ANSWERING RULES FOR THIS SECTION
--------------------------------------------------
- If someone asks something this reference doesn't cover, say so and point
  them at the official manual rather than guessing. Wrong audio advice during
  a live show is worse than no advice.
- ULX-D ships in several frequency bands and receivers come in 1, 2 and 4
  channel versions. Don't assert which ones ADV owns — ask, or tell them to
  read it off the front panel.
- For anything involving the specific channel patch or scene at CISD, defer
  to the A1 rather than inventing a patch list.
`;
