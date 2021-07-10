import ReactDOM from "react-dom";

export default function Dialog({ children }) {
    return ReactDOM.createPortal(
        <div className="dialog">
            <div className="dialog__wrapper">
                {children}
            </div>
        </div>,
        document.body
    )
}