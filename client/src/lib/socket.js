import socketIOClient from "socket.io-client";
import { getLocalStream, getStore, handleIceCandidate, handleWebRtcAnswer, prepareWebRtcAnswer, resetCallStateAfterHangUp, sendWebRTCOffer } from "../utils";

let socket;
export const socketIOConnection = (dispatch) => {
    socket = socketIOClient(process.env.REACT_APP_SERVER_URI);

    socket.on("connection", () => {
        console.log("Successfully connected to the wss server");
        
        socket.on("broadcast", (data) => {
            handleServerBroadcastEvent(dispatch, data);
        })

        socket.on("pre_offer", (data) => {
            handleCallRequestedPreOffer(dispatch, data);
        })

        socket.on("pre_offer_answer", (answer) => {
            handleCallRequestedPreOfferAnswer(dispatch, answer);
        })

        socket.on("web_rtc_offer", (offer) => {
            prepareWebRtcAnswer(socket, offer);
        })

        socket.on("web_rtc_answer", (answer) => {
            handleWebRtcAnswer(answer);
        })

        socket.on("send_ice_candidates", (candidate) => {
            handleIceCandidate(candidate);
        })

        socket.on("hang_up", () => {
            getLocalStream(dispatch).then(stream => {
                resetCallStateAfterHangUp(dispatch, stream);
            })
        })
    })
}

const handleServerBroadcastEvent = (dispatch, data) => {
    switch (data.event) {
        case "users":
            dispatch("SET_USERS", data.users);
            break;
        default:
            break;
    }
}


const handleCallRequestedPreOfferAnswer = async (dispatch, answer) => {
    switch (answer) {
        case "UNAVAILABLE":
            await dispatch("SET_CALL_STATE", "AVAILABLE");
            await dispatch("SET_CONNECTED_USER_SOCKET_ID", "");
            await dispatch("SET_CALLING_DIALOAG_STATE", false);
            alert("Sry, the callee is not available to pic up the call at the moment, Please try again leter!");
            break;
        case "REJECTED":
            await dispatch("SET_CONNECTED_USER_SOCKET_ID", "");
            await dispatch("SET_CALLING_DIALOAG_STATE", false);
            await dispatch("SET_CALL_STATE", "REJECTED");
            setTimeout(() => {
                dispatch("SET_CALL_STATE", "AVAILABLE");
            }, 5000);
            break;
        case "ACCEPTED":
            await sendWebRTCOffer(socket);
            break;
        default:
            break;
    }
}

const handleCallRequestedPreOffer = async (dispatch, caller) => {
    const store = getStore();
    if (store.call.callState === "AVAILABLE" && store.call.local_stream) {
        await dispatch("SET_CALLER_USERNAME", caller.username);
        await dispatch("SET_CONNECTED_USER_SOCKET_ID", caller.id);
        await dispatch("SET_CALL_STATE", "REQUESTED");
    } else {
        sendPreOfferRequestedAnswer(caller, "UNAVAILABLE");
    }
}

export const sendPreOfferRequestedAnswer = (caller, answer) => {
    socket.emit("pre_offer_answer", {
        caller,
        answer
    })
}

export const registerANewUser = async (username) => {
    socket.emit("register_naw_user", {
        username,
        id: socket.id 
    })
}

export const sendCallPreOfferToOtherUser = (callerDetails, calleeDetails) => {
    socket.emit("pre_offer", {
        callee: calleeDetails,
        caller: {...callerDetails, id: socket.id}
    })
}

export const sendIceCandidates = (candidate) => {
    const store = getStore();
    socket.emit("send_ice_candidates", {
        callee: store.call.connectedUserSocketId,
        candidate
    })
}

export const hangUpCallFromSocket = (dispatch, stream) => {
    const store = getStore();
    socket.emit("hang_up", {
        connectedUser: store.call.connectedUserSocketId
    });

    resetCallStateAfterHangUp(dispatch, stream);
}