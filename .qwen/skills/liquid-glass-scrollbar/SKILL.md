---
name: liquid-glass-scrollbar
description: Создание жидкостеклянной полосы прокрутки, соответствующей общей теме веб-сайта
source: auto-skill
extracted_at: '2026-06-08T21:38:16.852Z'
---

# Жидкостеклянная полоса прокрутки

## Описание навыка
Этот навык включает в себя создание и внедрение жидкостеклянной полосы прокрутки, которая гармонично вписывается в общий дизайн веб-сайта, используя современные CSS-техники и эффекты стекла.

## Процедура реализации

### 1. Основные принципы дизайна

Жидкостеклянная полоса прокрутки должна:
- Соответствовать общей цветовой схеме сайта
- Использовать эффекты размытия (backdrop-filter) для создания эффекта стекла
- Иметь плавные переходы и интерактивность
- Адаптироваться для разных размеров экранов

### 2. Базовая реализация жидкостеклянной полосы прокрутки

#### Основные стили:
```css
/* Глобальная полоса прокрутки */
::-webkit-scrollbar {
  width: 12px;
  height: 12px;
}

::-webkit-scrollbar-track { 
  background: transparent; 
  border-radius: 10px;
}

::-webkit-scrollbar-thumb { 
  background: linear-gradient(135deg, 
    color-mix(in oklab, var(--current-accent), transparent 70%), 
    color-mix(in oklab, var(--current-accent), transparent 90%)
  );
  border-radius: 10px; 
  border: 1px solid color-mix(in oklab, var(--current-accent), transparent 40%);
  backdrop-filter: blur(12px) saturate(180%);
  -webkit-backdrop-filter: blur(12px) saturate(180%);
  box-shadow: 
    inset 0 1px 0 rgba(255, 255, 255, 0.3),
    inset 0 -1px 0 rgba(0, 0, 0, 0.1),
    0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}
```

#### Эффект при наведении:
```css
::-webkit-scrollbar-thumb:hover { 
  background: linear-gradient(135deg, 
    color-mix(in oklab, var(--current-accent), transparent 85%), 
    color-mix(in oklab, var(--current-accent), transparent 95%)
  );
  border-color: color-mix(in oklab, var(--current-accent), transparent 60%);
  box-shadow: 
    inset 0 1px 0 rgba(255, 255, 255, 0.4),
    inset 0 -1px 0 rgba(0, 0, 0, 0.15),
    0 4px 16px rgba(0, 0, 0, 0.15);
}
```

### 3. Адаптация для кастомных компонентов

Для компонентов с собственной прокруткой (например, модальные окна, dropdown-меню):

```css
/* Кастомная прокрутка для компонентов */
.custom-scroll::-webkit-scrollbar {
  width: 8px;
}

.custom-scroll::-webkit-scrollbar-track {
  background: transparent;
}

.custom-scroll::-webkit-scrollbar-thumb {
  background: linear-gradient(135deg, 
    color-mix(in oklab, var(--current-accent), transparent 70%), 
    color-mix(in oklab, var(--current-accent), transparent 90%)
  );
  border-radius: 8px; 
  border: 1px solid color-mix(in oklab, var(--current-accent), transparent 40%);
  backdrop-filter: blur(8px) saturate(160%);
  -webkit-backdrop-filter: blur(8px) saturate(160%);
}
```

### 4. Адаптивность для мобильных устройств

```css
/* Медиа-запрос для мобильных устройств */
@media (max-width: 768px) {
  ::-webkit-scrollbar {
    width: 10px;
    height: 10px;
  }
  
  .custom-scroll::-webkit-scrollbar {
    width: 6px;
  }
}
```

### 5. Полная интеграция с существующим дизайном

Для полной интеграции с сайтом, использующим жидкостеклянные эффекты:

```css
/* Интеграция с существующими эффектами стекла */
::-webkit-scrollbar-thumb {
  /* Использование тех же переменных, что и для других элементов стекла */
  box-shadow: var(--glass-highlight), var(--depth-sm);
}

/* Скрытие стандартных элементов */
::-webkit-scrollbar-corner {
  background: transparent;
}

::-webkit-scrollbar-button {
  display: none;
}

::-webkit-scrollbar-track-piece {
  display: none;
}
```

### 6. Пример полной реализации

Для компонента с поиском (как в проекте):

```css
.cmdk-results {
  max-height: 46vh;
  overflow-y: auto;
  padding: var(--space-2);
  scrollbar-width: thin;
  scrollbar-color: var(--glass-border) transparent;
}

.cmdk-results::-webkit-scrollbar {
  width: 8px;
}

.cmdk-results::-webkit-scrollbar-track {
  background: transparent;
}

.cmdk-results::-webkit-scrollbar-thumb { 
  background: linear-gradient(135deg, 
    color-mix(in oklab, var(--current-accent), transparent 70%), 
    color-mix(in oklab, var(--current-accent), transparent 90%)
  );
  border-radius: 8px; 
  border: 1px solid color-mix(in oklab, var(--current-accent), transparent 40%);
  backdrop-filter: blur(8px) saturate(160%);
  -webkit-backdrop-filter: blur(8px) saturate(160%);
  box-shadow: 
    inset 0 1px 0 rgba(255, 255, 255, 0.3),
    inset 0 -1px 0 rgba(0, 0, 0, 0.1),
    0 1px 4px rgba(0, 0, 0, 0.1);
}

.cmdk-results::-webkit-scrollbar-thumb:hover { 
  background: linear-gradient(135deg, 
    color-mix(in oklab, var(--current-accent), transparent 85%), 
    color-mix(in oklab, var(--current-accent), transparent 95%)
  );
  border-color: color-mix(in oklab, var(--current-accent), transparent 60%);
}
```

### 7. Советы по оптимизации

1. **Производительность**: Эффекты размытия могут быть ресурсоемкими на мобильных устройствах. Рассмотрите возможность уменьшения значений `blur()` для слабых устройств.

2. **Цветовая схема**: Всегда используйте переменные CSS (`var(--current-accent)`) вместо жестко заданных цветов, чтобы обеспечить адаптивность к темной/светлой теме.

3. **Анимации**: Используйте плавные переходы (`transition: all 0.3s ease`) для улучшения пользовательского опыта.

4. **Тестирование**: Тестируйте на разных устройствах и в разных браузерах, так как поддержка WebGL-эффектов может различаться.

5. **Альтернативы**: Для старых браузеров, не поддерживающих `backdrop-filter`, предоставьте базовую стилизацию без эффектов стекла.

### 8. Совместимость

- **Современные браузеры**: Полная поддержка с эффектами стекла
- **Safari**: Требует префикса `-webkit-` для всех эффектов
- **Firefox**: Поддерживает `scrollbar-width` и `scrollbar-color`
- **Мобильные браузеры**: Поддерживается, но может быть ограничена сложность эффектов

Этот навык позволяет создавать гармоничные и современные интерфейсы, где даже такие элементы интерфейса, как полоса прокрутки, вносят вклад в общую эстетику сайта.