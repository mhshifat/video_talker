import { createContext, useContext, useEffect, useReducer, useRef } from "react";

const StoreContext = createContext();
export const useStore = () => useContext(StoreContext);
export default function StoreProvider({ children }) {
    const [state, dispatch] = useReducer(reducer, initialState);

    useEffect(() => {
        sessionStorage.setItem("store", JSON.stringify(state))
    }, [state])

    return (
        <StoreContext.Provider value={{
            store: state,
            getState: () => state,
            dispatch: (type, payload) => new Promise((resolve) => resolve(dispatch({ type, payload }) ))
        }}>
            {children}
        </StoreContext.Provider>
    )
};

const initialState = {
    dashboard: {
        username: "",
        users: [],
        groups: []
    },
    call: {
        local_stream: null,
        remote_stream: null,
        callState: "UNAVAILABLE",
        connectedUserSocketId: "",
        callingDialogState: false,
        callerUsername: "",
        local_mic_enabled: true,
        local_video_enabled: true,
        screenSharingActive: false,
        groupCallActive: false,
        groupCallStreams: [],
    }
}

function reducer(state = initialState, actions) {
    switch (actions.type) {
        case "SET_USERNAME":
            return {
                ...state,
                dashboard: {
                    ...state.dashboard,
                    username: actions.payload
                }
            }
        case "SET_USERS":
            return {
                ...state,
                dashboard: {
                    ...state.dashboard,
                    users: actions.payload
                }
            }
        case "SET_LOCAL_STREAM":
            return {
                ...state,
                call: {
                    ...state.call,
                    local_stream: actions.payload
                }
            }
        case "SET_CALL_STATE":
            return {
                ...state,
                call: {
                    ...state.call,
                    callState: actions.payload
                }
            }
        case "SET_CONNECTED_USER_SOCKET_ID":
            return {
                ...state,
                call: {
                    ...state.call,
                    connectedUserSocketId: actions.payload
                }
            }
        case "SET_CALLING_DIALOAG_STATE":
            return {
                ...state,
                call: {
                    ...state.call,
                    callingDialogState: actions.payload
                }
            }
        case "SET_CALLER_USERNAME":
            return {
                ...state,
                call: {
                    ...state.call,
                    callerUsername: actions.payload
                }
            }
        case "SET_REMOTE_STREAM":
            return {
                ...state,
                call: {
                    ...state.call,
                    remote_stream: actions.payload
                }
            }
        case "SET_LOCAL_MIC":
            return {
                ...state,
                call: {
                    ...state.call,
                    local_mic_enabled: actions.payload
                }
            }
        case "SET_LOCAL_VIDEO":
            return {
                ...state,
                call: {
                    ...state.call,
                    local_video_enabled: actions.payload
                }
            }
        case "SET_SCREEN_SHARING":
            return {
                ...state,
                call: {
                    ...state.call,
                    screenSharingActive: actions.payload
                }
            }
        case "RESET_STATE_AFTER_HANG_UP":
            return {
                ...state,
                call: {
                    ...state.call,
                    remote_stream: null,
                    callState: "AVAILABLE",
                    connectedUserSocketId: "",
                    callingDialogState: false,
                    callerUsername: "",
                    local_mic_enabled: true,
                    local_video_enabled: true,
                    screenSharingActive: false
                }
            }
        case "SET_GROUPS":
            return {
                ...state,
                dashboard: {
                    ...state.dashboard,
                    groups: actions.payload
                }
            }
        case "SET_GROUP_CALL_ACTIVE":
            return {
                ...state,
                call: {
                    ...state.call,
                    groupCallActive: actions.payload
                }
            }
        case "SET_GROUP_CALL_STREAMS":
            return {
                ...state,
                call: {
                    ...state.call,
                    groupCallStreams: [...state.call.groupCallStreams, actions.payload]
                }
            }
        case "RESET_GROUP_CALL_STREAMS":
            return {
                ...state,
                call: {
                    ...state.call,
                    groupCallStreams: [],
                    groupCallActive: false,
                    callState: "AVAILABLE"
                }
            }
        case "REMOVE_STREAM_ID_FROM_GROUPS":
            return {
                ...state,
                call: {
                    ...state.call,
                    groupCallStreams: state.call.groupCallStreams.filter(i => i.id !== actions.payload),
                }
            }
        default:
            return state;
    }   
}