## Plan: Original Arcade Visual Refresh

Обновить визуал legacy-клиента `client`: заменить персонажей, фоны и связанные графические ассеты на оригинальный набор в духе аркадного файтинга. Не использовать названия франшиз, существующих персонажей, логотипы, узнаваемые костюмы, силуэты, UI или копирование конкретных изображений.

**Scope and constraints**

- Первый клиент: `client` (Vanilla JS), не `server/client` (React).
- Первый проверочный набор: один персонаж и фон экрана выбора.
- Итоговый набор: 6 бойцов, фон выбора, фон арены, оригинальный логотип и VS-графика.
- Общий стиль: насыщенная 2D game illustration, сильные силуэты, четкий контур, драматичный свет, насыщенные красный/бирюзовый/золотой акценты, но без визуального копирования конкретной игры.
- Для персонажа: PNG с прозрачностью, 1024x1536 или близкий portrait ratio, полный рост, руки и ноги не обрезаны.
- Для фона: JPG или WebP, 1920x1080, широкая композиция, свободный центр/верхний слой для интерфейса.
- Имена пилота: `fighter-01.png` и `main-bg.jpg`. Если генератор не поддерживает прозрачность, удалить фон отдельным background-removal инструментом и проверить края.

**First iteration**

1. Сгенерировать персонажа `fighter-01.png` и `main-bg.jpg` по промтам ниже.
2. Положить файлы в `client/resources/`.
3. Подключить локальный источник персонажа через существующее поле `source` в `client/resources/api/fighters.json` и `client/src/javascript/helpers/mockData.js`, только если текущие данные используют внешний URL.
4. Открыть экран выбора, проверить масштаб персонажа, читаемость имени и отсутствие обрезания фона.
5. После утверждения стиля использовать тот же visual bible для пяти остальных персонажей и `arena.jpg`.

**Prompt 1: pilot fighter**

```text
Create an original arcade fighting game character named "Kestrel", a full-body agile courier-fighter from a fictional coastal city. Lean athletic build, asymmetrical cropped jacket in cobalt blue and warm orange, lightweight reinforced boots, fingerless gloves, a small utility satchel, short dark hair with one copper streak. Confident three-quarter combat stance, one hand open and one hand ready to strike, readable silhouette, expressive face, grounded anatomy, dynamic but clean pose. Bold 2D game illustration, crisp inked contour, hand-painted texture, controlled cel shading, dramatic warm rim light, high contrast, saturated but coherent colors. Isolated character only, centered, entire body visible, generous transparent padding around the silhouette, transparent background, no text, no logo, no weapon, no scenery. Original design with no resemblance to any existing franchise or character. Output as a clean PNG with transparency, portrait canvas, suitable for a character-select screen.
```

**Prompt 2: character-select background**

```text
Create an original wide background for an arcade fighting game character-select screen: a fictional elevated night market called "Lantern Circuit", built on old rooftops above a rain-washed coastal city. Layered tiled roofs, hanging paper lanterns, colorful fabric awnings, distant bridges and soft ocean lights, a few empty vendor stalls, subtle rain haze. Cinematic 2D game environment illustration, bold architectural shapes, crisp painterly detail, deep charcoal shadows, warm amber lanterns contrasted with teal night air, restrained red accents, energetic but uncluttered composition. Keep the central and upper-middle area visually calm and dark enough for character portraits and interface text; place detail toward the sides and lower third. No people, no text, no logos, no recognizable real-world landmarks, no existing game or franchise references. 16:9 landscape composition, 1920x1080, production-ready background plate.
```

**Negative prompt / exclusions**

```text
existing franchise, copyrighted character, celebrity likeness, game logo, brand logo, copied costume, copied pose, copied UI, text, watermark, signature, extra limbs, extra fingers, malformed hands, cropped feet, cropped head, duplicate character, muddy silhouette, photorealistic 3D render, flat empty background, unreadable low contrast
```

**Integration points**

- `client/resources/` — generated images.
- `client/resources/api/fighters.json` — fighter records and `source` values.
- `client/src/javascript/helpers/mockData.js` — mock fighter records when `useMockAPI` remains enabled.
- `client/src/javascript/components/fightersView.js` and `fighterPreview.js` — existing `fighter.source` rendering contract.
- `client/src/styles/fighters.css` - `main-bg.jpg` background.
- `client/src/styles/arena.css` — later `arena.jpg` background.
- `client/index.html` - existing loading logo, to be replaced only after the first visual style is approved.

**Verification**

1. Run `npm run build --prefix client`.
2. Run `npm run lint --prefix client`.
3. Run the Vite client on port `7800` and inspect the selection screen at desktop and mobile widths.
4. Confirm the pilot PNG has transparency, no broken image requests, no cropped body parts, and sufficient contrast against `main-bg.jpg`.
5. Do not generate the remaining assets until the pilot and background are visually consistent as one set.
