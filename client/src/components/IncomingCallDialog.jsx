import { sendPreOfferRequestedAnswer } from "../lib/socket";
import Dialog from "./Dialog";

export default function IncomingCallDialog({ username, store, dispatch }) {
    const handleCallRejected = async () => {
        sendPreOfferRequestedAnswer(
            { id: store.call.connectedUserSocketId },
            "REJECTED"
        );
        await dispatch("SET_CALL_STATE", "AVAILABLE");
        await dispatch("SET_CONNECTED_USER_SOCKET_ID", "");
        await dispatch("SET_CALLER_USERNAME", "");
    }

    const handleCallAccepted = async () => {
        sendPreOfferRequestedAnswer(
            { id: store.call.connectedUserSocketId },
            "ACCEPTED"
        );
    }
    
    return (
        <Dialog>
            <h3>Incoming Call from {username}...</h3>
            <div>
                <button onClick={handleCallRejected} className="btn btn-danger">Reject</button>
                <button onClick={handleCallAccepted} className="btn btn-success">Accept</button>
            </div>
        </Dialog>
    );
}