const expressionDisplay = document.querySelector("#expression");
const resultDisplay = document.querySelector("#result");
const keypad = document.querySelector(".keypad");

let expression = "";
let justSolved = false;

function formatNumber(value) {
  if (!Number.isFinite(value)) return "Error";
  if (Math.abs(value) >= 1e12 || (value !== 0 && Math.abs(value) < 1e-8)) {
    return value.toExponential(6).replace(/\.?(0+)e/, "e");
  }
  return String(Number(value.toFixed(10)));
}

function evaluate(source) {
  const tokens = source.match(/\d*\.?\d+|[+\-*/]/g);
  if (!tokens || tokens.join("") !== source) throw new Error("Invalid expression");

  const values = [];
  const operators = [];
  let expectingValue = true;

  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];
    if (/^\d/.test(token) || token.startsWith(".")) {
      if (!expectingValue) throw new Error("Missing operator");
      values.push(Number(token));
      expectingValue = false;
      continue;
    }

    if (expectingValue) {
      if (token !== "-") throw new Error("Missing number");
      const next = tokens[index + 1];
      if (!next || !/^\d/.test(next) && !next.startsWith(".")) throw new Error("Missing number");
      values.push(-Number(next));
      index += 1;
      expectingValue = false;
      continue;
    }

    operators.push(token);
    expectingValue = true;
  }

  if (expectingValue || values.length !== operators.length + 1) throw new Error("Incomplete expression");

  for (let index = 0; index < operators.length;) {
    if (operators[index] === "*" || operators[index] === "/") {
      const left = values[index];
      const right = values[index + 1];
      const answer = operators[index] === "*" ? left * right : left / right;
      values.splice(index, 2, answer);
      operators.splice(index, 1);
    } else {
      index += 1;
    }
  }

  let answer = values[0];
  operators.forEach((operator, index) => {
    answer = operator === "+" ? answer + values[index + 1] : answer - values[index + 1];
  });
  if (!Number.isFinite(answer)) throw new Error("Cannot divide by zero");
  return answer;
}

function updateDisplay() {
  const trimmed = expression.replace(/[+\-*/]+$/, "");
  expressionDisplay.textContent = expression
    ? expression.replace(/\*/g, "×").replace(/\//g, "÷").replace(/-/g, "−")
    : "Ready when you are";
  resultDisplay.classList.remove("is-error");

  if (!trimmed || trimmed === "-") {
    resultDisplay.textContent = "0";
    return;
  }

  try {
    resultDisplay.textContent = formatNumber(evaluate(trimmed));
  } catch {
    resultDisplay.textContent = "...";
  }
}

function enterDigit(digit) {
  if (justSolved) expression = "";
  justSolved = false;
  const match = expression.match(/(?:^|[+\-*/])(-?\d*\.?\d*)$/);
  const current = match ? match[1] : "";
  if (current === "0") expression = expression.slice(0, -1) + digit;
  else expression += digit;
  updateDisplay();
}

function enterOperator(operator) {
  if (!expression) {
    if (operator === "-") expression = "-";
    updateDisplay();
    return;
  }
  if (/[+\-*/]$/.test(expression)) expression = expression.slice(0, -1) + operator;
  else expression += operator;
  justSolved = false;
  updateDisplay();
}

function enterDecimal() {
  if (justSolved) expression = "";
  justSolved = false;
  const current = expression.split(/[+\-*/]/).pop();
  if (current.includes(".")) return;
  expression += current ? "." : "0.";
  updateDisplay();
}

function currentNumberStart() {
  const match = expression.match(/[+\-*/](?:-)?\d*\.?\d*$|^-?\d*\.?\d*$/);
  return match ? expression.length - match[0].length : expression.length;
}

function toggleSign() {
  if (!expression || justSolved) {
    expression = expression ? `-${expression}` : "-";
    justSolved = false;
  } else {
    const start = currentNumberStart();
    const segment = expression.slice(start);
    const operatorLength = /^[+\-*/]/.test(segment) ? 1 : 0;
    const numberStart = start + operatorLength;
    if (expression[numberStart] === "-") expression = expression.slice(0, numberStart) + expression.slice(numberStart + 1);
    else expression = expression.slice(0, numberStart) + "-" + expression.slice(numberStart);
  }
  updateDisplay();
}

function applyPercent() {
  if (!expression || justSolved) return;
  const start = currentNumberStart();
  const segment = expression.slice(start);
  const operatorLength = /^[+\-*/]/.test(segment) ? 1 : 0;
  const numberStart = start + operatorLength;
  const number = expression.slice(numberStart);
  if (!number || number === "-") return;
  const percentage = formatNumber(Number(number) / 100);
  expression = expression.slice(0, numberStart) + percentage;
  updateDisplay();
}

function solve() {
  const trimmed = expression.replace(/[+\-*/]+$/, "");
  if (!trimmed) return;
  try {
    expression = formatNumber(evaluate(trimmed));
    justSolved = true;
    updateDisplay();
  } catch {
    resultDisplay.textContent = "Try that again";
    resultDisplay.classList.add("is-error");
  }
}

function clear() {
  expression = "";
  justSolved = false;
  updateDisplay();
}

function backspace() {
  if (justSolved) return clear();
  expression = expression.slice(0, -1);
  updateDisplay();
}

function popGlitter(button) {
  const colors = ["#e6b84f", "#e98e7c", "#78ad8d", "#83b7ca"];
  const shapes = ["✦", "✧", "✳", "⋆"];

  for (let index = 0; index < 8; index += 1) {
    const angle = (Math.PI * 2 * index) / 8 + Math.random() * 0.25;
    const distance = 25 + Math.random() * 16;
    const particle = document.createElement("span");
    particle.className = "glitter-particle";
    particle.setAttribute("aria-hidden", "true");
    particle.textContent = shapes[index % shapes.length];
    particle.style.color = colors[index % colors.length];
    particle.style.setProperty("--spark-x", `${Math.cos(angle) * distance}px`);
    particle.style.setProperty("--spark-y", `${Math.sin(angle) * distance}px`);
    particle.style.setProperty("--spark-turn", `${Math.random() * 100 - 50}deg`);
    particle.addEventListener("animationend", () => particle.remove(), { once: true });
    button.append(particle);
  }
}

keypad.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) return;
  popGlitter(button);
  if (button.dataset.digit !== undefined) return enterDigit(button.dataset.digit);
  if (button.dataset.operator) return enterOperator(button.dataset.operator);

  switch (button.dataset.action) {
    case "clear": clear(); break;
    case "decimal": enterDecimal(); break;
    case "sign": toggleSign(); break;
    case "percent": applyPercent(); break;
    case "equals": solve(); break;
  }
});

document.addEventListener("keydown", (event) => {
  if (/^\d$/.test(event.key)) enterDigit(event.key);
  else if (["+", "-", "*", "/"].includes(event.key)) enterOperator(event.key);
  else if (event.key === ".") enterDecimal();
  else if (event.key === "Enter" || event.key === "=") { event.preventDefault(); solve(); }
  else if (event.key === "Backspace") backspace();
  else if (event.key === "Escape" || event.key === "Delete") clear();
  else if (event.key === "%") applyPercent();
});

updateDisplay();