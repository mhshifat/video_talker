import { sendIceCandidates } from "../lib/socket";

export const getLocalStream = async (dispatch) => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: true,
        });
        createRTCConnection(dispatch, stream);
        return stream;
    } catch (err) {
        console.log(err);
    }
}

export const getStore = () => {
    const store = sessionStorage.getItem("store");
    return store ? JSON.parse(store) : {};
}

let peerConnection;
const createRTCConnection = (dispatch, stream) => {
    peerConnection = new RTCPeerConnection({
        iceServers: [
            { urls: "stun:stun.l.google.com:19302" }
        ]
    })

    for (const track of stream.getTracks()) {
        peerConnection.addTrack(track, stream);
    }

    peerConnection.ontrack = ({ streams: [stream] }) => {
        dispatch("SET_REMOTE_STREAM", stream);
    }

    peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
            sendIceCandidates(event.candidate);
        }
    }
}

export const sendWebRTCOffer = async (socket) => {
    const store = getStore();
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    socket.emit("web_rtc_offer", {
        callee: store.call.connectedUserSocketId,
        offer
    })
}

export const prepareWebRtcAnswer = async (socket, offer) => {
    const store = getStore();
    await peerConnection.setRemoteDescription(offer);
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    socket.emit("web_rtc_answer", {
        caller: store.call.connectedUserSocketId,
        answer
    })
}

export const handleWebRtcAnswer = async (answer) => {
    await peerConnection.setRemoteDescription(answer);
}


export const handleIceCandidate = async (candidate) => {
    try {
        await peerConnection.addIceCandidate(candidate);
    } catch (err) {
        console.log("Error while exchanging ice candidate", err);
    }
}

let screenSharingStream;
export const switchScreenHandler = async (store, dispatch) => {
    if (!store.call.screenSharingActive) {
        screenSharingStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const senders = peerConnection.getSenders();
        const videoTracks = screenSharingStream.getVideoTracks()[0];
        const sender = senders.find(s => s.track.kind === videoTracks.kind);
        sender.replaceTrack(videoTracks);
        dispatch("SET_SCREEN_SHARING", true);
    } else {
        const localStream = store.call.local_stream;
        const senders = peerConnection.getSenders();
        const videoTracks = localStream.getVideoTracks()[0];
        const sender = senders.find(s => s.track.kind === videoTracks.kind);
        sender.replaceTrack(videoTracks);
        screenSharingStream.getVideoTracks().forEach(track => track.stop());
        dispatch("SET_SCREEN_SHARING", false);
    }
}

export const resetCallStateAfterHangUp = async (dispatch, stream) => {
    const store = getStore();
    peerConnection.close();
    peerConnection = null;
    createRTCConnection(dispatch, stream);
    await dispatch("RESET_STATE_AFTER_HANG_UP");

    if (store.call.screenSharingActive) {
        screenSharingStream.getVideoTracks().forEach(track => track.stop());
    }
}


const incomingCallTune = new Audio("/incoming_call_tune.mp3");
incomingCallTune.volume = 0.1;
incomingCallTune.loop = true;

export const startIncomingCallAudio = () => {
    incomingCallTune.play();
}


export const stopIncomingCallAudio = () => {
    incomingCallTune.pause();
    incomingCallTune.currentTime = 0;
}