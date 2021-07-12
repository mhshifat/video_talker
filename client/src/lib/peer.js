import { getStore } from "../utils";
import { joinARoomWithSocket, leaveGroupWithSocket, registerANewRoomWithSocket } from "./socket";

let myPeer;
let peerId;
let incomingStreams = [];
export const connectWithMyPeer = (stream, dispatch) => {
    myPeer = new window.Peer(undefined, {
        path: "/peer",
        host: process.env.REACT_APP_SERVER_URI_WITHOUT,
        port: process.env.REACT_APP_NODE_ENV === "dev" ? "5000" : "443"
    });

    myPeer.on("open", (id) => {
        console.log("Successfully connected with peer Server");
        peerId = id;
    })

    myPeer.on("call", (call) => {
        call.answer(stream);
        call.on("stream", (incomingStream) => {
            const stream = incomingStreams.find(i => i.id === incomingStream.id);
            if (!stream) {
                incomingStreams.push(incomingStream);
                dispatch("SET_GROUP_CALL_STREAMS", incomingStream);
            }
        })
    })
}

export const registerNewRoomWithPeer = () => {
    const store = getStore();
    const data = {
        peerId,
        username: store.dashboard.username
    }
    registerANewRoomWithSocket(data);
}

let joinedRoomId;
export const joinARoomWithPeer = (data) => {
    joinedRoomId = data.roomId;
    joinARoomWithSocket({...data, peerId})
}

export const sendGroupCall = (data, stream, dispatch) => {
    const call = myPeer.call(data.peerId, stream);
    call.on("stream", (incomingStream) => {
        const stream = incomingStreams.find(i => i.id === incomingStream.id);
        if (!stream) {
            incomingStreams.push(incomingStream);
            dispatch("SET_GROUP_CALL_STREAMS", incomingStream);
        }
    })
}

export const leaveGroupWithPeer = (dispatch, stream) => {
    leaveGroupWithSocket({ roomId: joinedRoomId, streamId: stream.id });

    resetVideoCallGroups(stream, dispatch);
}

export const resetVideoCallGroups = async (stream, dispatch) => {
    myPeer.destroy();
    connectWithMyPeer(stream, dispatch);
    incomingStreams = [];
    await dispatch("RESET_GROUP_CALL_STREAMS")
}