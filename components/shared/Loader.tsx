"use client";

import { useTheme } from "next-themes";
import React, { useEffect, useState } from "react";
import { ClipLoader } from "react-spinners";

const Loader = () => {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && resolvedTheme === "dark";

  return (
    <div
      className="flex size-full h-screen items-center justify-center gap-3"
      suppressHydrationWarning
    >
      <ClipLoader color={isDark ? "#ffffff" : "#1e1e1e"} size={40} />
    </div>
  );
};

export default Loader;
