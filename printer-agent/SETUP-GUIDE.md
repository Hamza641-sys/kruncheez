# 🖨️ KrunchEez Printer Agent — Setup Guide

## Step 1: Node.js Install Karo
1. https://nodejs.org pe jao
2. **LTS version** download karo (green button)
3. Install karo (Next > Next > Finish)
4. Test: Command Prompt kholo, likho: `node --version`

---

## Step 2: Printer Driver Install Karo
1. Thermal printer USB se PC se connect karo
2. Printer ke saath CD aati hai — driver install karo
3. Ya manufacturer website se download karo
4. Dono printers ke liye repeat karo

---

## Step 3: Printer Names Pata Karo
1. Is folder mein Command Prompt kholo
2. Run karo:
```
node list-printers.js
```
3. Apne printers ke exact naam note karo

---

## Step 4: Config Update Karo
`config.js` file kholo aur update karo:
```js
counterPrinter: "YOUR COUNTER PRINTER NAME HERE",
kitchenPrinter: "YOUR KITCHEN PRINTER NAME HERE",
```

---

## Step 5: Dependencies Install Karo
Command Prompt mein is folder mein run karo:
```
npm install
```

---

## Step 6: Agent Start Karo
Double-click karo: **start.bat**

Ya Command Prompt mein:
```
node agent.js
```

---

## Step 7: Test Karo
1. Agent chalu karo (green text dikhega)
2. Website pe ek test order karo
3. Dono printers pe automatic print hoga!

---

## Auto Start with Windows (Optional)
Agar chahte ho ke PC on hone pe agent automatically start ho:
1. `Win + R` dabaao → `shell:startup` likho → Enter
2. `start.bat` ka shortcut wahan paste karo

---

## Troubleshooting

| Problem | Solution |
|---------|---------|
| "node not found" | Node.js dobara install karo |
| "printer not found" | list-printers.js se exact name copy karo |
| "module not found" | npm install dobara run karo |
| Print nahi ho raha | Printer ka driver check karo |

---

## Support
Koi masla ho to developer se contact karo.
