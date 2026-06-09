---
name: web-glass-effects-integration
description: Интеграция трехмерных эффектов стекла (three.js) и жидкого стекла для веб-интерфейсов
source: auto-skill
extracted_at: '2026-06-08T20:57:02.283Z'
---

# Веб-интеграция эффектов стекла

## Описание навыка
Этот навык включает в себя интеграцию трехмерных стеклянных эффектов с использованием Three.js и эффектов жидкого стекла для создания современных, визуально привлекательных веб-интерфейсов.

## Процедура реализации

### 1. Установка и подготовка зависимостей

```bash
# Клонируйте необходимые репозитории
git clone https://github.com/CloudAI-X/threejs-skills.git
git clone https://github.com/dashersw/liquid-glass-js.git
```

### 2. Интеграция Three.js для фоновых эффектов стекла

#### Основные шаги:
1. Добавьте в HTML импорт Three.js:
```html
<script type="importmap">
{ "imports": { "three": "https://cdn.jsdelivr.net/npm/three@0.160.1/build/three.module.js" } }
</script>
```

2. Создайте сцену с улучшенными стеклянными осколками:
```javascript
function shardGeometries() {
  function thinTri(a, b, c, depth) {
    var s = new THREE.Shape();
    s.moveTo(a[0], a[1]); s.lineTo(b[0], b[1]); s.lineTo(c[0], c[1]); s.closePath();
    var g = new THREE.ExtrudeGeometry(s, { 
      depth: depth, 
      bevelEnabled: true, 
      bevelThickness: 0.02, 
      bevelSize: 0.03, 
      bevelSegments: 2,
      curveSegments: 4
    });
    g.center(); 
    return g;
  }
  
  function glassPane(width, height) {
    var shape = new THREE.Shape();
    shape.rect(-width/2, -height/2, width, height);
    var geometry = new THREE.ExtrudeGeometry(shape, { 
      depth: 0.02, 
      bevelEnabled: true, 
      bevelThickness: 0.05, 
      bevelSize: 0.05,
      bevelSegments: 3
    });
    geometry.center();
    return geometry;
  }
  
  return [
    thinTri([0, 1.15], [0.95, -0.7], [-0.85, -0.55], 0.08),
    glassPane(1.5, 2.0),
    glassPane(0.8, 0.8),
    new THREE.BoxGeometry(1.2, 0.8, 0.05),
    new THREE.CylinderGeometry(0.6, 0.6, 0.1, 6),
    new THREE.OctahedronGeometry(0.8)
  ];
}
```

3. Настройте материалы для реалистичного стекла:
```javascript
var mat = new THREE.MeshPhysicalMaterial({
  color: 0xffffff,
  metalness: 0,
  roughness: 0.02 + Math.random() * 0.06,
  transparent: true,
  opacity: 0.12 + Math.random() * 0.12,
  ior: 1.52, // Реалистичный показатель преломления стекла
  reflectivity: 0.7,
  clearcoat: 1.2,
  clearcoatRoughness: 0.02,
  side: THREE.DoubleSide,
  flatShading: false,
  depthWrite: false,
  transmission: 0.85,
  thickness: 0.5
});
```

### 3. Интеграция Liquid Glass JS для кнопок

#### Основные шаги:
1. Добавьте необходимые скрипты и стили:
```html
<!-- Liquid Glass CSS -->
<link rel="stylesheet" href="./liquid-glass-js/glass.css">
<!-- Liquid Glass JS -->
<script src="https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js"></script>
<script src="./liquid-glass-js/container.js"></script>
<script src="./liquid-glass-js/button.js"></script>
```

2. Создайте функцию для применения эффекта ко всем кнопкам:
```javascript
function initLiquidGlass() {
  // Настройте глобальные параметры для единообразия
  window.glassControls = {
    edgeIntensity: 0.025,
    rimIntensity: 0.1,
    baseIntensity: 0.03,
    blurRadius: 8,
    tintOpacity: 0.25,
    edgeDistance: 0.1,
    rimDistance: 0.3,
    baseDistance: 0.1
  };

  // Примените эффект ко всем интерактивным элементам
  var buttons = document.querySelectorAll('button, .button, .btn, a[role="button"], .social-grid a, .nav-link, .link-card');
  
  buttons.forEach(function(button) {
    if (button.classList.contains('glass-button') || button.closest('.glass-container')) {
      return;
    }
    
    var buttonText = button.textContent.trim() || button.getAttribute('aria-label') || 'Button';
    
    // Создайте кнопку с эффектом жидкого стекла
    var glassButton = new Button({
      text: buttonText,
      size: 16,
      type: 'rounded',
      tintOpacity: 0.25,
      onClick: function() {
        button.click();
      }
    });
    
    // Скопируйте стили оригинальной кнопки
    var originalStyles = window.getComputedStyle(button);
    glassButton.element.style.margin = originalStyles.margin;
    glassButton.element.style.padding = originalStyles.padding;
    
    // Скрыть оригинальную кнопку и заменить на стеклянную
    button.style.display = 'none';
    button.parentNode.insertBefore(glassButton.element, button.nextSibling);
  });
}
```

### 4. Улучшение переключателя тем

#### Основные шаги:
1. Улучшите инициализацию темы:
```javascript
function initTheme() {
  var toggle = document.getElementById('themeToggle');
  var stored = null;
  try { stored = localStorage.getItem('theme'); } catch (_) {}
  var sysDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  var theme = stored || (sysDark ? 'dark' : 'light');
  document.documentElement.setAttribute('data-theme', theme);
  
  if (toggle) {
    // Обновите иконку переключателя в соответствии с текущей темой
    var isDark = theme === 'dark';
    toggle.querySelector('.sun').style.opacity = isDark ? '0' : '1';
    toggle.querySelector('.sun').style.transform = isDark ? 'rotate(90deg) scale(0)' : 'rotate(0) scale(1)';
    toggle.querySelector('.moon').style.opacity = isDark ? '1' : '0';
    toggle.querySelector('.moon').style.transform = isDark ? 'rotate(0) scale(1)' : 'rotate(-90deg) scale(0)';
    
    // Добавьте обработчик изменений
    toggle.addEventListener('click', function () {
      var next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      try { localStorage.setItem('theme', next); } catch (_) {}
      
      // Обновите иконку
      var isDarkNext = next === 'dark';
      toggle.querySelector('.sun').style.opacity = isDarkNext ? '0' : '1';
      toggle.querySelector('.sun').style.transform = isDarkNext ? 'rotate(90deg) scale(0)' : 'rotate(0) scale(1)';
      toggle.querySelector('.moon').style.opacity = isDarkNext ? '1' : '0';
      toggle.querySelector('.moon').style.transform = isDarkNext ? 'rotate(0) scale(1)' : 'rotate(-90deg) scale(0)';
    });
    
    // Следите за изменениями системной темы
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function(e) {
      if (!localStorage.getItem('theme')) {
        var newTheme = e.matches ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', newTheme);
        
        // Обновите иконку
        var isDark = newTheme === 'dark';
        toggle.querySelector('.sun').style.opacity = isDark ? '0' : '1';
        toggle.querySelector('.sun').style.transform = isDark ? 'rotate(90deg) scale(0)' : 'rotate(0) scale(1)';
        toggle.querySelector('.moon').style.opacity = isDark ? '1' : '0';
        toggle.querySelector('.moon').style.transform = isDark ? 'rotate(0) scale(1)' : 'rotate(-90deg) scale(0)';
      }
    });
  }
}
```

### 5. Оптимизация производительности

#### Основные шаги:
1. Используйте IntersectionObserver для паузы анимации при невидимости:
```javascript
var hero = document.querySelector('.hero');
if ('IntersectionObserver' in window && hero) {
  new IntersectionObserver(function (en) {
    visible = en[0].isIntersecting;
    if (visible && running) loop();
  }, { threshold: 0 }).observe(hero);
}
```

2. Оптимизируйте количество осколков для мобильных устройств:
```javascript
var COUNT = isMobile ? 15 : 30;
```

3. Добавьте обработку изменений размера окна:
```javascript
window.addEventListener('resize', function () {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}, { passive: true });
```

### 6. Советы по использованию

1. **Единообразие стиля**: Всегда используйте одинаковые параметры для всех элементов с эффектом жидкого стекла, чтобы сохранить визуальную целостность.

2. **Адаптивность**: Учитывайте мобильные устройства при настройке количества элементов и сложности анимации.

3. **Производительность**: Мониторьте производительность, особенно на мобильных устройствах, и снижайте сложность при необходимости.

4. **Тестирование**: Тестируйте на разных устройствах и в разных браузерах, так как WebGL может работать по-разному.

5. **Альтернативы**: Всегда предоставляйте альтернативный вариант для устройств, где WebGL недоступен.

Этот навык позволяет создавать современные, визуально привлекательные интерфейсы с использованием эффектов стекла, которые подчеркивают современность и технологичность дизайна.