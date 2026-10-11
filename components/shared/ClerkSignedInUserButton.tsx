"use client";

import { Show, UserButton } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { useTheme } from "next-themes";

const ClerkSignedInUserButton = () => {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const themeVariables = {
    colorPrimary: "#00afdb",
    colorBackground: isDark ? "#0f172a" : "#ffffff",
    colorInputBackground: isDark ? "#1e293b" : "#f1f5f9",
    colorInputText: isDark ? "#f8fafc" : "#0f172a",
    colorText: isDark ? "#f8fafc" : "#0f172a",
    colorTextSecondary: isDark ? "#94a3b8" : "#64748b",
    colorNeutral: isDark ? "#f8fafc" : "#0f172a",
    colorShimmer: isDark ? "#1e293b" : "#e2e8f0",
  };

  return (
    <Show when="signed-in">
      <UserButton
        appearance={{
          theme: isDark ? dark : undefined,
          variables: themeVariables,
          elements: {
            userButtonAvatarBox: "size-9 border-2 border-primary",
            userButtonPopoverCard:
              "border border-border bg-surface text-foreground shadow-xl rounded-xl",
            userButtonPopoverFooter: "border-t border-border bg-background",
            userButtonPopoverActionButton:
              "text-foreground hover:bg-surface-hover hover:text-foreground",
            userButtonPopoverActionButtonIcon: "text-muted",
          },
        }}
        userProfileProps={{
          appearance: {
            theme: isDark ? dark : undefined,
            variables: themeVariables,
            elements: {
              card: "border border-border bg-surface text-foreground shadow-2xl rounded-2xl",
              navbar: "border-r border-border bg-surface-canvas",
              navbarButton:
                "text-muted hover:text-foreground hover:bg-surface-hover data-[active=true]:bg-surface-secondary data-[active=true]:text-foreground",
              headerTitle: "text-foreground font-semibold",
              headerSubtitle: "text-muted",
              profileSection: "border-b border-border",
              profileSectionTitle: "text-foreground border-b border-border",
              profileSectionPrimaryButton: "text-primary hover:text-primary-hover",
              formButtonPrimary: "bg-primary hover:bg-primary-hover text-white",
              formButtonReset: "text-muted hover:text-foreground hover:bg-surface-hover",
              modalContent: "border border-border bg-surface text-foreground rounded-2xl",
              modalBackdrop: "backdrop-blur-xs bg-black/60",
            },
          },
        }}
      />
    </Show>
  );
};

export default ClerkSignedInUserButton;
