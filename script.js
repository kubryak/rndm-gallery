import { ACCESS_KEY } from './access_key.js';

gsap.registerPlugin();

const imageContainer = document.getElementById("image-container");
const numberOfImages = 10; // Количество картинок

let loadedImages = []; // Массив для хранения загруженных изображений

// Функция для генерации случайных чисел в диапазоне
// Функция для генерации случайных позиций в процентах от ширины и высоты экрана
function getRandomPosition(loadedImages) {
    const imgWidth = 300; // Ширина картинки
    const imgHeight = 300; // Высота картинки
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    const maxOverlap = 50; // Максимальное наложение в пикселях
    const maxAttempts = 100; // Максимальное количество попыток
    
    let randomXPercent, randomYPercent;
    let overlapped = false;
    let attempts = 0;

    do {
        randomXPercent = Math.random() * (100 - (imgWidth / windowWidth) * 100);
        randomYPercent = Math.random() * (100 - (imgHeight / windowHeight) * 100);
        
        // Проверяем, есть ли наложение с другими изображениями
        overlapped = loadedImages.some((image) => {
            const rect1 = image.getBoundingClientRect();
            const rect2 = {
                left: randomXPercent * windowWidth / 100,
                top: randomYPercent * windowHeight / 100,
                right: (randomXPercent + imgWidth / windowWidth * 100) * windowWidth / 100,
                bottom: (randomYPercent + imgHeight / windowHeight * 100) * windowHeight / 100
            };

            return !(rect1.right < rect2.left + maxOverlap ||
                     rect1.left > rect2.right - maxOverlap ||
                     rect1.bottom < rect2.top + maxOverlap ||
                     rect1.top > rect2.bottom - maxOverlap);
        });

        attempts++;

        // Проверяем, не превысили ли количество попыток
        if (attempts >= maxAttempts) {
            console.warn('Reached maximum attempts to find non-overlapping position.');
            return { x: randomXPercent, y: randomYPercent }; // Можно вернуть последнее найденное значение
        }

    } while (overlapped);

    return { x: randomXPercent, y: randomYPercent };
}



// Функция для загрузки и отображения изображений
async function fetchAndDisplayImages() {
    try {
        // Проверяем localStorage на наличие данных
        const savedImages = JSON.parse(localStorage.getItem('savedImages'));
        if (savedImages && savedImages.length === numberOfImages) {
            // Если данные есть, используем их
            displayImages(savedImages);
            return;
        }
        
        // Если данных в localStorage нет, делаем запрос на Unsplash
        const response = await fetch(
            "https://api.unsplash.com/photos/random?count=" +
                numberOfImages +
                `&client_id=${ACCESS_KEY}`
        );
        const data = await response.json();
        // Сохраняем полученные данные в localStorage
        localStorage.setItem('savedImages', JSON.stringify(data));
        displayImages(data);
    } catch (error) {
        console.error("Failed to fetch images:", error);
    }
}

// Функция для отображения изображений
function displayImages(data) {
    // Очищаем контейнер перед добавлением новых изображений
    imageContainer.innerHTML = '';
    data.forEach((imgData, index) => {
        const img = new Image();
        img.src = imgData.urls.regular;
        
        img.onload = () => {
            const position = getRandomPosition(loadedImages);
            img.style.left = `${position.x}%`;
            img.style.top = `${position.y}%`;
            imageContainer.appendChild(img);
            loadedImages.push(img); // Добавляем загруженное изображение в массив

            ScrollTrigger.create({
                trigger: imageContainer,
                start: "top top", // Начинать анимацию, когда верх изображения достигнет центра экрана
                end: "bottom bottom", // Заканчивать анимацию, когда низ изображения достигнет центра экрана
                onUpdate: (self) => {
                    const progress = self.progress; // Прогресс прокрутки от 0 до 1
                    const scale = 1 + 0.5 * progress; // Увеличиваем масштаб от 1 до 1.5 по мере прокрутки
                    gsap.to(img, { duration: 0.5, scale: scale, opacity: 1 - progress });
                }
            });
        };
    });
}


// Инициализация загрузки и отображения изображений
fetchAndDisplayImages();

// Пример условного запроса изображений
// Вы можете вызывать fetchAndDisplayImages() при необходимости, например, по клику на кнопку
// document.getElementById('fetch-images-button').addEventListener('click', function() {
//     fetchAndDisplayImages();
// });
