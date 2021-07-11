import { useEffect, useRef } from "react";

export default function GroupCallVideo({ stream }) {
    const videoRef = useRef(null);

    useEffect(() => {
        if (stream) {
            videoRef.current.srcObject = stream;

            videoRef.current.addEventListener("loadedmetadata", () => {
                videoRef.current.play();
            })
        }
    }, [stream]);

    return <video ref={videoRef} className="group_video" style={{ width: "100px" }} />
}