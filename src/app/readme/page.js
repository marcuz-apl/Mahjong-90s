'use client';

import React from 'react';
import Link from 'next/link';

export default function ReadmePage() {
  return (
    <div className="readmeLayout">
      <div className="readmeScanlines" />
      
      <div className="readmeContainer">
        {/* Glowing Title Header */}
        <header className="readmeHeader">
          <h1 className="readmeTitle">讀我 / READ ME</h1>
          <p className="readmeSubtitle">追憶 1990s 街機麻雀的青蔥歲月与項目起源</p>
          <div className="readmeDecoLine" />
        </header>

        {/* Scrollable content container */}
        <div className="readmeContent">
          {/* Section 1: The smoky arcades */}
          <section className="readmeSection">
            <h2 className="sectionHeading">🎰 煙霧繚繞的 1990s 遊戲廳</h2>
            <p className="sectionText">
              在那個電腦尚未普及、網際網路還是奢侈幻想的 1990 年代，街道拐角處那家燈光昏暗、煙霧繚繞的「街機遊戲廳」（Game Center）是無數 80 後與 90 後的青春避風港。
            </p>
            <p className="sectionText">
              在嘈雜的《街頭霸王》格鬥聲、《三國戰紀》嘶吼聲中，最角落裡總是擺著幾台特製的金黃色橫向面板鍵盤機台。那裡沒有搖桿，取而代之的是一排排貼著 A 到 N 字母的微動機械按鍵。
              這就是專屬於「街機麻將」的方寸天地。
            </p>
          </section>

          {/* Section 2: Origin of Denshi Kiban */}
          <section className="readmeSection">
            <h2 className="sectionHeading">💾 《電子基盤》與《天開眼》的誕生</h2>
            <p className="sectionText">
              **1988 年**，日本街機廠商 **DYNAX** 推出了风靡亞洲的日式立直麻將街機《電子基盤》（Mahjong Denshi Kiban）。
              它嚴格遵循日式麻將「無役不能和牌」的硬核博弈規則，並開創了標誌性的「三元交換（換牌）」作弊玩法。
            </p>
            <p className="sectionText">
              隨後推出的《天開眼》（Tenkai-gan）則更進一步，引入了充滿魔幻感的「透視眼」作弊外掛。
              每逢起手發牌或聽牌的關鍵時刻，天眼驟開，對手暗牌一覽無遺，這種在機台前掌控全局的爽快感，讓無數玩家為之瘋狂，也成了當年在遊戲廳裡口口相傳的傳奇。
            </p>
          </section>

          {/* Section 3: Project Origin */}
          <section className="readmeSection">
            <h2 className="sectionHeading">🛠️ 項目起源：復刻與傳承</h2>
            <p className="sectionText">
              三十年彈指一揮間。昔日的游戏廳早已沒入歷史塵埃，斑駁的機台也被丟進廢鐵回收站。
              為了留住這份屬於一代人青蔥歲月的集體記憶，我們發起了這個「街機麻將復刻項目」。
            </p>
            <p className="sectionText">
              我們使用現代的 **Next.js 15** 框架配合 **better-sqlite3** 後台數據庫，百分之百還原了 1990s 經典的像素象牙牌質感與 3D 傾斜視覺。
              我們甚至重新設計了 Web Audio API 晶片合成音，還原了當年打牌時乾脆利落的「叮咚」嗶嗶聲、摸牌的急促 chirps 以及海底撈月時極具震撼力的「電光石火」閃電 sparks 音效。
            </p>
          </section>

          {/* Section 4: Game Features */}
          <section className="readmeSection">
            <h2 className="sectionHeading">🌟 經典機制重現</h2>
            <ul className="featureList">
              <li>
                <strong>單槽牌河 & 心跳脈衝</strong>：不同於傳統麻將，本作還原了街機獨有的「單牌河」機制，只顯示當前打出的那張牌，並附帶動態 3D 浮空、放大與粉紅色霓虹「心跳脈衝」呼吸燈，絕不漏看。
              </li>
              <li>
                <strong>互動式海底機會</strong>：摸完最後一張牌若處於聽牌狀態，會進入互動式三張牌蓋卡抽獎，選中聽牌即可達成「海底撈月（Haidi Tsumo）」役滿！
              </li>
              <li>
                <strong>值班經理作弊調校</strong>：在管理員專區（預設密碼 admin123），您可以手動調節 AI 行為參數、吃碰概率，甚至是「作弊配牌大牌概率（0% - 100%）」，起手大三元、大四喜、國士無雙不再是夢！
              </li>
            </ul>
          </section>

          {/* Section 5: Nostalgia Ending */}
          <section className="readmeSection">
            <h2 className="sectionHeading">🌸 致敬我們終將逝去的青春</h2>
            <p className="sectionText" style={{ fontStyle: 'italic', color: 'rgba(255,255,255,0.7)' }}>
              「投幣的清脆聲音、鍵盤敲擊的彈簧回饋、螢幕上像素美女通關時的笑靨…… 
              我們懷念的不僅僅是一台街機，而是那個攥著五毛錢鋼鏰、沒有房貸與工作壓力、為了胡一把『九連寶燈』能高興一整天的無憂無慮的夏天。」
            </p>
          </section>
        </div>

        {/* Floating Back Button */}
        <footer className="readmeFooter">
          <Link href="/" className="readmeBackBtn">
            <span>返回大堂 / RETURN LOBBY</span>
          </Link>
        </footer>
      </div>
    </div>
  );
}
