import { useEffect, useRef, useState } from "react";
import type { ImageSourcePropType } from "react-native";
import { Image, ImageResizeMode } from "react-native";

type SpriteAnimationProps = {
    frames: ImageSourcePropType[];
    interval?: number;
    className?: string;
    resizeMode?: ImageResizeMode;
};

export function SpriteAnimation({
    frames,
    interval = 300,
    className = "w-32 h-32",
    resizeMode = "contain",
}: SpriteAnimationProps) {
    const [frame, setFrame] = useState(0);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        intervalRef.current = setInterval(() => {
            setFrame((prev) => (prev + 1) % frames.length);
        }, interval);

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [frames, interval]);

    return (
        <Image
            source={frames[frame]}
            className={className}
            resizeMode={resizeMode}
        />
    );
}
