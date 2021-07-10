import { useStore } from "../provider/StoreProvider";
import { useHistory } from "react-router-dom";
import { registerANewUser } from "../lib/socket";

export default function Login() {
    const history = useHistory();
    const { dispatch } = useStore();

    const handleLogin = async (e) => {
        e.preventDefault();
        await dispatch("SET_USERNAME", e.target.username.value);
        await registerANewUser(e.target.username.value);
        e.target.reset();
        history.push("/dashboard");
    }

    return (
        <div className="login">
            <form onSubmit={handleLogin} className="login__form">
                <h3>VideoTalker</h3>
                <input type="text" name="username" placeholder="Username" />
                <button type="submit">Continue</button>
            </form>
        </div>
    )
}