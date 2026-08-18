// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { LanguageProvider, useLanguage } from "@/contexts/LanguageContext";
import LanguageSwitcher from "./LanguageSwitcher";
import React from "react";

function Probe() {
  const { t } = useLanguage();
  return <p>{t("nextUpgrade")}</p>;
}

describe("言語切替", () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.lang = "ja";
  });

  it("英語・中国語へ切り替え、選択言語を端末内に保存する", () => {
    render(<LanguageProvider><LanguageSwitcher /><Probe /></LanguageProvider>);

    expect(screen.getByText("優先して強化する項目")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "English" }));
    expect(screen.getByText("Priority Upgrades")).toBeTruthy();
    expect(window.localStorage.getItem("starrail-build-advisor.language")).toBe("en");
    expect(document.documentElement.lang).toBe("en");

    fireEvent.click(screen.getByRole("button", { name: "简体中文" }));
    expect(screen.getByText("优先强化项目")).toBeTruthy();
    expect(window.localStorage.getItem("starrail-build-advisor.language")).toBe("zh-CN");
    expect(document.documentElement.lang).toBe("zh-CN");
  });
});
