import { hangUpCallFromSocket } from "../lib/socket";
import Dialog from "./Dialog";

export default function CallingDialog({ dispatch, store }) {
    const hangUpCallButtonClick = () => {
        hangUpCallFromSocket(dispatch, store.call.local_stream);   
    }

    return (
        <Dialog>
            <h3>Calling...</h3>
            <div>
                <button className="btn btn-danger" onClick={hangUpCallButtonClick}>End</button>
            </div>
        </Dialog>
    );
}