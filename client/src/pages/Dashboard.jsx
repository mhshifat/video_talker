import { Fragment, useEffect, useRef } from "react";
import { useStore } from "../provider/StoreProvider"
import { getLocalStream, startIncomingCallAudio, stopIncomingCallAudio, switchScreenHandler } from "../utils";
import { hangUpCallFromSocket, sendCallPreOfferToOtherUser } from "../lib/socket";
import CallingDialog from "../components/CallingDialog";
import IncomingCallDialog from "../components/IncomingCallDialog";
import CallRejectedDialog from '../components/CallRejectedDialog';
import { MdCallEnd, MdCamera, MdCameraAlt, MdMic, MdMicOff, MdVideocam, MdVideocamOff, MdVideoLabel } from "react-icons/md";
import { connectWithMyPeer, joinARoomWithPeer, leaveGroupWithPeer, registerNewRoomWithPeer } from "../lib/peer";
import GroupCallVideo from "../components/GroupCallVideo";

export default function Dashboard() {
    const { store, dispatch } = useStore();
    const localStreamRef = useRef(null);
    const remoteVideoRef = useRef(null);

    useEffect(() => {
        getLocalStream(dispatch)
            .then(async (stream) => {
                await dispatch("SET_LOCAL_STREAM", stream);
                await dispatch("SET_CALL_STATE", "AVAILABLE")
                await connectWithMyPeer(stream, dispatch);
            })
    }, [])

    useEffect(() => {
        if (store.call.local_stream) {
            localStreamRef.current.srcObject = store.call.local_stream;

            localStreamRef.current.addEventListener("loadedmetadata", () => {
                localStreamRef.current.play();
            })
        }
    }, [store.call.local_stream]);

    useEffect(() => {
        if (store.call.remote_stream) {
            remoteVideoRef.current.srcObject = store.call.remote_stream;

            remoteVideoRef.current.addEventListener("loadedmetadata", () => {
                remoteVideoRef.current.play();
            })
        }
    }, [store.call.remote_stream]);

    useEffect(() => {
        if (store.call.callState === "REQUESTED") {
            startIncomingCallAudio();
        } else {
            stopIncomingCallAudio();
        }
    }, [store])

    const sendCallToOtherUser = async (calleeDetails) => {
        await dispatch("SET_CALL_STATE", "IN_PROGRESS");
        await dispatch("SET_CONNECTED_USER_SOCKET_ID", calleeDetails.id);
        await dispatch("SET_CALLING_DIALOAG_STATE", true);
        sendCallPreOfferToOtherUser(
            { username: store.dashboard.username },
            calleeDetails
        );
    }

    const switchLocalMic = async () => {
        const local_stream = store.call.local_stream;
        local_stream.getAudioTracks()[0].enabled = !store.call.local_mic_enabled;
        await dispatch("SET_LOCAL_MIC", !store.call.local_mic_enabled); 
    }

    const switchLocalVideo = async () => {
        const local_stream = store.call.local_stream;
        local_stream.getVideoTracks()[0].enabled = !store.call.local_video_enabled;
        await dispatch("SET_LOCAL_VIDEO", !store.call.local_video_enabled); 
    }

    const switchCamara = () => {
        switchScreenHandler(store, dispatch);   
    }

    const hangUpCallButtonClick = () => {
        hangUpCallFromSocket(dispatch, store.call.local_stream);   
    }

    const createANewRoom = async () => {
        await dispatch("SET_GROUP_CALL_ACTIVE", true);
        await dispatch("SET_CALL_STATE", "IN_PROGRESS");
        registerNewRoomWithPeer();   
    }

    const joinARoom = async (data) => {
        await dispatch("SET_GROUP_CALL_ACTIVE", true);
        await dispatch("SET_CALL_STATE", "IN_PROGRESS");
        joinARoomWithPeer(data); 
    }

    const leaveGroup = async (stream) => {
        leaveGroupWithPeer(dispatch, stream);
    }
    

    return (
        <Fragment>
            <div className="dashboad">
                <div className="dashboard__header">
                    <div className="dashboard__top">
                        <div>
                            <h3>Hello, {store.dashboard.username}! welcome to <span>VideoTalker</span>.</h3>
                            <p>You can start a call directly to a person from the list or you can create or join an existing group.</p>
                        </div>

                        <span>
                            <video className="local_video" ref={localStreamRef} src="" />
                        </span>
                    </div>
                    <div className="dashboard__content">
                        {store.call.remote_stream && <video className="remote__video" ref={remoteVideoRef} src="" />}
                        <div className="videos_wrapper">
                            {!!store.call.groupCallStreams.length && store.call.groupCallStreams.map((stream, ind) => (
                                <GroupCallVideo key={ind} stream={stream} />
                            ))}
                        </div>
                        {(store.call.remote_stream || store.call.groupCallActive) && <div>
                            <div>
                                <button className="btn" onClick={switchLocalMic}>
                                    {store.call.local_mic_enabled && <MdMic />}
                                    {!store.call.local_mic_enabled && <MdMicOff />}
                                </button>
                                <button className="btn" onClick={switchLocalVideo}>
                                    {store.call.local_video_enabled && <MdVideocam />}
                                    {!store.call.local_video_enabled && <MdVideocamOff />}
                                </button>
                            </div>

                            <div>
                                <button className="btn" onClick={switchCamara}>
                                    {!store.call.screenSharingActive && <MdVideoLabel />}
                                    {store.call.screenSharingActive && <MdCamera />}
                                </button>
                                {!store.call.groupCallActive && <button className="btn" onClick={hangUpCallButtonClick}>
                                    <MdCallEnd />
                                </button>}
                            </div>
                        </div>}
                    </div>
                    <div>
                        {store.call.callState !== "IN_PROGRESS" && !store.call.groupCallActive && <button onClick={createANewRoom} type="button">Create Room</button>}
                        {/* {store.call.callState === "IN_PROGRESS" && <button type="button">Chat</button>} */}
                        {store.call.groupCallActive && <button onClick={() => leaveGroup(store.call.local_stream)} type="button">Leave Group</button>}
                    </div>
                </div>
                <div className="dashboard__people">
                    {store.dashboard.users.filter(u => u.username !== store.dashboard.username).map(item => (
                        <div onClick={() => sendCallToOtherUser(item)} className="dashboard__person" key={item.id}>
                            <img src="https://www.pikpng.com/pngl/m/292-2924795_user-icon-png-transparent-white-user-icon-png.png" alt="" />
                            <h3>{item.username}</h3>
                        </div>
                    ))}
                </div>
                <div className="dashboard__groups">
                    {store.dashboard.groups.map(g => (
                        <div onClick={() => joinARoom({
                            roomId: g.roomId,
                            hostSocketId: g.socketId,
                            streamId: store.call.local_stream.id
                        })} key={g.roomId} className="dashboard__groupItem">
                            { g.host }
                        </div>
                    ))}
                </div>
            </div>

            {/* Dialogs */}
            {store.call.callingDialogState && !store.call.remote_stream && <CallingDialog store={store} dispatch={dispatch} />}
            {store.call.callState === "REQUESTED" && !store.call.remote_stream && <IncomingCallDialog store={store} dispatch={dispatch} username={store.call.callerUsername} />}
            {store.call.callState === "REJECTED" && <CallRejectedDialog />}
        </Fragment>
    )
}