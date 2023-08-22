const without_anime_checkbox = document.createElement("input");
without_anime_checkbox.type = "checkbox";
without_anime_checkbox.id = "without_anime";
document.body.appendChild(without_anime_checkbox);
if (localStorage.getItem("without_anime") === null) { localStorage.setItem("without_anime", false); }

const limit = 10;
let ModelsSelectedType = 'Checkpoint';
const baseUrl = `https://civitai.com/api/v1/models?limit=${limit}&sort=Newest&types=${ModelsSelectedType}`;
var loader = document.createElement('div');
loader.className = 'loader';
var PreloadText = document.createElement('span');
PreloadText.textContent = 'загрузка данных';
loader.appendChild(PreloadText);
document.body.appendChild(loader);
function fetchData(urls) {
    showLoader();
    Promise.all(urls.map(url => fetch(url).then(response => {
        if (!response.ok) {
            throw new Error(`выпал пролапс: ${response.statusText}`);
        }
        return response.json();
    })))
        .then(results => {
            let content = '';
            content += `<header><div class="clipboard"><label title="вкл/выкл ведения списка скопированных ссылок"><input type="checkbox" id="clipboard_switch" /><span class="clipboard_switch"></span></label></div><div class="hide_anime"><label title="скрытие/показ моделей с тегом anime"><input type="checkbox" name="" id="without_anime"><span class="anime_switch"></span></label></div><div class="content_width"><label title="шире/уже колонка контента"><input type="checkbox" name="" id="wide_normal_width"><span class="width_switch"></span></label></div></header>`
            let uniqueIds = new Set();
            results.forEach(data => {
                const items = data.items;
                const metadata = data.metadata;
                items.forEach(item => {
                    if (!uniqueIds.has(item.id)) {
                        uniqueIds.add(item.id);
                        let without_anime = document.querySelector("#without_anime").checked;
                        if (without_anime ? (!('mode' in item) && (!item.tags || item.tags.length === 0) || (item.tags && !item.tags.includes("anime"))) : (!('mode' in item))) {
                            content += `<div class="model_item" type="${item.type}">`
                            if (item.modelVersions[0] && item.modelVersions[0].downloadUrl) {
                                content += `<h2 class="model_name"><a class="file_url" ModelUrl="${item.modelVersions[0].downloadUrl}">${item.name}</a>`
                                if (item.stats.rating) { content += `<div class="rating">рейтинг: ${item.stats.rating} (голосов: ${item.stats.ratingCount})</div>`; }
                                content += `<a class="download_latest" href="${item.modelVersions[0].downloadUrl}">⭳</a></h2>`;
                            }
                            content += `<div class="versions"> версии:`
                            const versions = item.modelVersions;
                            versions.forEach(version => { if (version.name) { content += `<a class="version_url" versurl="${version.downloadUrl}">${version.name}</a>`; } });
                            content += `</div>`
                            if (item.modelVersions[0] && item.modelVersions[0].trainedWords && item.modelVersions[0].trainedWords.length > 0) { content += `<div class="triggers">${item.modelVersions[0].trainedWords.map(trainedWord => `<n>${trainedWord}</n>`).join('')}</div>`; }
                            if (item.tags && item.tags.length > 0) {
                                if (metadata.nextPage && metadata.nextPage.includes('tag')) {
                                    content += `<div class="tags" tag_search="${metadata.nextPage.match(/tag=(.*?)&/)[1]}">${item.tags.map(tag => `<n>${tag}</n>`).join('')}</div>`;
                                } else {
                                    content += `<div class="tags">${item.tags.map(tag => `<n>${tag}</n>`).join('')}</div>`;
                                }
                            }
                            if (item.modelVersions[0] && item.modelVersions[0].images && item.modelVersions[0].images.length > 0) {
                                content += `<div class="images">`
                                const images = item.modelVersions[0].images.slice(0, 5);
                                images.forEach(image => {
                                    content += `<div class="preview">`
                                    if (image.url) { content += `<div class="picture"><img class="img" src="${image.url}" alt="${item.name}" /></div>`; }
                                    if (image.meta) { content += `<div class="img_params">`; } else { content += `<div class="no_params">это изображение не содержит метаданных</div>`; }
                                    if (image.meta && image.meta.seed) { content += `<div class="seed">seed: <n>${image.meta.seed}</n></div>`; }
                                    if (image.meta && image.meta.steps) { content += `<div class="steps">steps: <n>${image.meta.steps}</n></div>`; }
                                    if (image.meta && image.meta.prompt) { content += `<div class="prompt">prompt: <n>${image.meta.prompt}</n></div>`; }
                                    if (image.meta && image.meta.negativePrompt) { content += `<div class="negative">negative: <n>${image.meta.negativePrompt}</n></div>`; }
                                    if (image.meta && image.meta.sampler) { content += `<div class="sampler">sampler: <n>${image.meta.sampler}</n></div>`; }
                                    if (image.meta && image.meta.cfgScale) { content += `<div class="cfgScale">cfg: <n>${image.meta.cfgScale}</n></div>`; }
                                    if (image.meta && image.meta["Denoising strength"]) { content += `<div class="hires">hires up: <n>${image.meta["Hires upscale"]}, ${image.meta["Hires upscaler"]}, denoise ${image.meta["Denoising strength"]}</n></div>`; }
                                    if (item.type != 'Checkpoint' && item.modelVersions[0].baseModel) {content += `<div class="sdbase">база: ${item.modelVersions[0].baseModel}</div>`}
                                    if (image.meta && item.type != 'Checkpoint' && image.meta.Model) { content += `<div class="checkpoint">использована модель: ${image.meta.Model}</div>`; }
                                    if (image.meta) { content += `</div>`; }
                                    content += `</div>`
                                });
                                content += `</div>`
                            } else { content += `<div class="noimage">либо модераторы цивитаи не пропустили ни одно изображение этой модели, либо - <a href="https://civitai.com/user/${item.creator.username}">этот пидр</a> не удосужился загрузить хотя бы одну картинку</div>` }

                            if (item.description) { content += `<details class="info"><summary>описание и дополнительная информация</summary><div class="description">${item.description}</div></details>`; }
                            content += `</div>`
                        }
                        if (document.querySelector("#empty")) {document.querySelector("#empty").remove();}
                    }
                });
            });
            if (results.length > 0) {
                const metadata = results[0].metadata;
                const currentPage = metadata.currentPage;
                const totalPages = metadata.totalPages;
                content += generatePagination(currentPage, totalPages, ModelsSelectedType);
            }
            content += footer_content;
            document.getElementById('content').innerHTML = content;
            lesstext(document.querySelectorAll('div.prompt > n'), 350);
            lesstext(document.querySelectorAll('div.negative > n'), 350);

// - - //
            var imagesElements = document.querySelectorAll('.images');
            for (var i = 0; i < imagesElements.length; i++) {
                (function () {
                    var imagesElement = imagesElements[i];
                    var previewElements = imagesElement.querySelectorAll('.preview');
                    if (previewElements.length > 1) {
                        var currentPreviewIndex = 0;
                        var LeafOver = document.createElement('span');
                        LeafOver.setAttribute("class", "leafover")
                        imagesElement.prepend(LeafOver);
                        var prevButton = document.createElement('button');
                        prevButton.textContent = '🡰';
                        prevButton.addEventListener('click', function () {
                            previewElements[currentPreviewIndex].style.display = 'none';
                            currentPreviewIndex--;
                            if (currentPreviewIndex < 0) {
                                currentPreviewIndex = previewElements.length - 1;
                            }
                            previewElements[currentPreviewIndex].style.display = 'flex';
                        });
                        LeafOver.prepend(prevButton);
                        var nextButton = document.createElement('button');
                        nextButton.textContent = '🡲';
                        nextButton.addEventListener('click', function () {
                            previewElements[currentPreviewIndex].style.display = 'none';
                            currentPreviewIndex++;
                            if (currentPreviewIndex >= previewElements.length) {
                                currentPreviewIndex = 0;
                            }
                            previewElements[currentPreviewIndex].style.display = 'flex';
                        });
                        LeafOver.prepend(nextButton);
                    }
                })();
            }
            var SmallImgs = document.querySelectorAll('img.img');
            for (var i = 0; i < SmallImgs.length; i++) {
                var SmallImg = SmallImgs[i];
                SmallImg.addEventListener('click', function (event) {
                    var imgSrc = event.target.src;
                    var newImgSrc = imgSrc.replace('/width=450/', '/optimized=false/');
                    var FullBigImage = document.createElement('div');
                    var FullImgPreloadText = document.createElement('span');
                    FullImgPreloadText.textContent = 'загрузка картинки'
                    FullBigImage.appendChild(FullImgPreloadText);
                    FullBigImage.setAttribute("class", "fullimage_container")
                    var FullImg = document.createElement('img');
                    FullImg.setAttribute("class", "fullimage")
                    FullImg.src = newImgSrc;
                    FullBigImage.appendChild(FullImg);
                    document.body.appendChild(FullBigImage);
                    if (FullBigImage) {
                        FullBigImage.addEventListener('click', function (event) {
                            if (event.target === FullBigImage) {FullBigImage.remove();}
                        });
                        document.addEventListener('keydown', function (event) {
                            if (event.key === 'Escape') {FullBigImage.remove();}
                        });
                    }
                });
            }
            var detailsElements = document.querySelectorAll('div.model_item > details.info');
            detailsElements.forEach(function (details) {
                var collapseLink = document.createElement('a');
                collapseLink.setAttribute('class', 'collapse_info')
                collapseLink.href = '#';
                collapseLink.textContent = 'свернуть';
                collapseLink.addEventListener('click', function (event) {
                    event.preventDefault();
                    details.removeAttribute('open');
                    var modelItem = details.closest('div.model_item');
                    var lastChild = modelItem.querySelector('div.images > div.preview:not(style[display=none]) > div.img_params:last-child');
                    if (lastChild) {
                        lastChild.scrollIntoView({ behavior: 'smooth' });
                    }
                });
                details.appendChild(collapseLink);
            });

            var keywordsToRemove = ['buymeacoffee.com', 'bmc.link', 'ko-fi.com', 'patreon.com', 'boosty.to', 'discordapp.com', 'discord.gg', 'threads.net', 'instagram.com', 'streamlabs.com'];
            var descriptionElements = document.querySelectorAll('div.description');
            for (var i = 0; i < descriptionElements.length; i++) {
                var descriptionElement = descriptionElements[i];
                var linkElements = descriptionElement.querySelectorAll('a');
                for (var j = 0; j < linkElements.length; j++) {
                    var linkElement = linkElements[j];
                    if (keywordsToRemove.some(keyword => linkElement.href.includes(keyword))) {
                        linkElement.remove();
                    }
                }
            }
            url_copier('a.file_url', 'modelurl');
            url_copier('a.version_url', 'versurl');

            if (!document.querySelector("body > div.up_arrow")) {UpArrowButton();}

            var typesList = ["Checkpoint", "LORA", "LoCon", "TextualInversion", "VAE", "Hypernetwork", "Controlnet", "Poses", "Other"];
            var namesList = ["модели", "лоры", "ликорисы", "внедрения", "ваэ", "гиперсети", "контролнет", "позы", "другое"];
            let headerTypeText = 'ничего не найдено'
            const ModelTypeHeader = document.createElement('div');
            ModelTypeHeader.setAttribute('class', 'modeltype_header');
            if (document.querySelector('div.model_item')) { headerTypeText = namesList[typesList.indexOf(document.querySelector('div.model_item').getAttribute('type'))]; }
            ModelTypeHeader.textContent = headerTypeText;
            if (headerTypeText === 'модели') {
                ModelTypeHeader.textContent = 'StableDiffusion checkpoints: модели весов';
            } else if (headerTypeText === 'лоры') {
                ModelTypeHeader.textContent = 'StableDiffusion LoRa: низкоранговые адаптации для моделей';
            } else if (headerTypeText === 'ликорисы') {
                ModelTypeHeader.textContent = 'StableDiffusion LyCORIS: LoCon/LoHA и другие методы адаптаций весов';
            } else if (headerTypeText === 'внедрения') {
                ModelTypeHeader.textContent = 'StableDiffusion Embedding Textual Inversions: внедрения текстовых инверсий';
            } else if (headerTypeText === 'ваэ') {
                ModelTypeHeader.textContent = 'StableDiffusion VAE: веса вариационных автоэнкодеров';
            } else if (headerTypeText === 'гиперсети') {
                ModelTypeHeader.textContent = 'StableDiffusion Hypernetworks: гиперсети перехвата перекресного внимания';
            } else if (headerTypeText === 'контролнет') {
                ModelTypeHeader.textContent = 'StableDiffusion ControlNet: управляющие сети входных условий';
            } else if (headerTypeText === 'позы') {
                ModelTypeHeader.textContent = 'StableDiffusion Poses: наборы поз OpenPose';
            } else if (headerTypeText === 'другое') {
                ModelTypeHeader.textContent = 'Дополнительные материалы, гайды, воркфлоу';
            }
            var tagsDiv = document.querySelector("#content > div.model_item > div.tags");
            if (tagsDiv && tagsDiv.hasAttribute("tag_search")) {
                ModelTypeHeader.textContent = ModelTypeHeader.textContent.slice(0, ModelTypeHeader.textContent.indexOf(":")) + ": тэг " + tagsDiv.getAttribute("tag_search");
            }
            ModelTypeHeader.title = ModelTypeHeader.textContent;
            ModelTypeHeader.setAttribute('trimmed', ModelTypeHeader.textContent.slice(0, ModelTypeHeader.textContent.indexOf(":")));

            document.querySelector("header").appendChild(ModelTypeHeader);
            var selectElement = document.createElement('select');
            selectElement.setAttribute('id', 'models_type_selector');
            for (var i = 0; i < typesList.length; i++) {
                var optionElement = document.createElement('option');
                optionElement.value = typesList[i];
                optionElement.textContent = namesList[i];
                selectElement.appendChild(optionElement);
            }
            selectElement.addEventListener('change', function (event) {
                var selectedType = event.target.value;
                localStorage.setItem('selectedType', selectedType);
                fetchData([`https://civitai.com/api/v1/models?limit=${limit}&sort=Newest&types=` + selectedType])
                ModelsSelectedType = selectedType;
                const metadata = results[0].metadata;
                const currentPage = metadata.currentPage;
                const totalPages = metadata.totalPages;
                content += generatePagination(currentPage, totalPages, ModelsSelectedType);
            });
            document.querySelector("header").appendChild(selectElement);

            const customSelect = document.createElement("ul");
            customSelect.classList.add("custom-select");

            const placeholderLi = document.createElement("li");
            placeholderLi.classList.add("placeholder");
            customSelect.appendChild(placeholderLi);

            selectElement.querySelectorAll("option").forEach(option => {
                const li = document.createElement("li");
                li.textContent = option.textContent;
                li.dataset.value = option.value;
                customSelect.appendChild(li);
            });

            customSelect.addEventListener("click", event => {
                if (event.target.tagName === "LI" && !event.target.classList.contains("placeholder")) {
                    selectElement.value = event.target.dataset.value;
                    selectElement.dispatchEvent(new Event("change"));
                    placeholderLi.textContent = event.target.textContent;
                    customSelect.classList.remove("open");
                }
            });

            placeholderLi.addEventListener("click", () => {
                customSelect.classList.toggle("open");
            });

            document.addEventListener("click", event => {
                if (!customSelect.contains(event.target)) {
                    customSelect.classList.remove("open");
                }
            });

            selectElement.parentNode.insertBefore(customSelect, selectElement);
            selectElement.style.display = "none";

            if (headerTypeText != 'ничего не найдено') {customSelect.querySelector("li").textContent = headerTypeText;} else { customSelect.querySelector("li").textContent = 'категории'; }

            var savedSelectedType = localStorage.getItem('selectedType');
            if (savedSelectedType) {
                selectElement.value = savedSelectedType;
                ModelsSelectedType = savedSelectedType;
            }

            var findnew = document.createElement('div');
            findnew.setAttribute('class', 'findnew');
            document.querySelector("header").appendChild(findnew);
            findnew.innerHTML = `<div class="popular"><div class="malefocus" title="мужские"></div><div class="topdownload" title="топ по загрузкам"></div><div class="liked" title="топ по лайкам"></div></div>`
            var search = document.createElement('div');
            search.setAttribute('class', 'search');
            findnew.appendChild(search);
            var inputElement = document.createElement('input');
            inputElement.placeholder = 'введи что-нибудь для поиска';
            inputElement.type = 'text';
            inputElement.setAttribute('class', 'search_field');
            inputElement.addEventListener('keydown', function (event) {
                if (event.key === 'Enter') {
                    var selectedType = selectElement.value;
                    var enteredText = event.target.value;
                    fetchData([
                        `https://civitai.com/api/v1/models?limit=50&sort=Newest&types=` + selectElement.value + `&query=` + enteredText,
                        `https://civitai.com/api/v1/models?limit=50&sort=Newest&types=` + selectElement.value + `&username=` + enteredText,
                        `https://civitai.com/api/v1/models?limit=50&sort=Newest&types=` + selectElement.value + `&tag=` + enteredText
                    ]);
                }
            });

            var buttonElement = document.createElement('button');
            buttonElement.setAttribute('class', 'search_button');
            buttonElement.addEventListener('click', function () {
                var selectedType = selectElement.value;
                var enteredText = inputElement.value;
                fetchData([
                    `https://civitai.com/api/v1/models?limit=50&sort=Newest&types=` + selectElement.value + `&query=` + enteredText,
                    `https://civitai.com/api/v1/models?limit=50&sort=Newest&types=` + selectElement.value + `&username=` + enteredText,
                    `https://civitai.com/api/v1/models?limit=50&sort=Newest&types=` + selectElement.value + `&tag=` + enteredText
                ]);
            });
            search.appendChild(inputElement);
            search.appendChild(buttonElement);

            var tagElements = document.querySelectorAll('div.tags > n');
            for (var i = 0; i < tagElements.length; i++) {
                var tagElement = tagElements[i];
                tagElement.addEventListener('click', function (event) {
                    var selectedType = selectElement.value;
                    var tagText = event.target.textContent;
                    fetchData([`https://civitai.com/api/v1/models?limit=100&sort=Newest&types=` + selectedType + `&tag=` + tagText]);
                });
            }

            const gay_tags = ['gay', 'homoerotic', 'homosexual', 'masculine', 'male focus', 'homo', 'manly', 'group male', 'muscular male', 'naked men', 'mature men', 'mature male', 'mature man', 'naked man', 'muscular', 'sexy men', 'bara', 'daddy', 'twink', 'boys', 'bodybuilder', 'muscles', 'cock', 'dick', 'penis', 'male', 'man', 'men', 'lgbtqia+', 'lgbt', 'yaoi',];
            document.querySelector("div.malefocus").addEventListener('click', function () {
                const urls = gay_tags.map(gay_tag => `https://civitai.com/api/v1/models?limit=100&sort=Newest&types=${selectElement.value}&tag=${gay_tag}`);
                fetchData(urls);
            });

            document.querySelector("div.topdownload").addEventListener('click', function () {
                fetchData([`https://civitai.com/api/v1/models?limit=100&sort=Most Downloaded&types=` + selectElement.value]);
            });

            document.querySelector("div.liked").addEventListener('click', function () {
                fetchData([`https://civitai.com/api/v1/models?limit=100&sort=Most Liked&types=` + selectElement.value]);
            });

            hideLoader();
            if (document.querySelectorAll('div.model_item').length === 0) {
                var emptyDiv = document.createElement('div');
                emptyDiv.id = 'empty';
                emptyDiv.innerHTML = `<h3>Поиск по civitai не дал никаких результатов!</h3><div>Это не значит что по искомому запросу действительно ничего нет, просто на цивитаи крайне плохой поисковик.</div><div>Вот что можно сделать:<ol><li>не используй пробелы в запросе</li><li>поиск на цивитаи не полнотекстовый, и может искать только по тегам, точным названиям моделей, именам авторов</li><li>возможно ты сделал опечатку, или тебе просто не повезло</li></ol></div><div>вернись в начало или посмотри что тебя еще может заинтересовать:</div><div class="popular"><span class="malefocus">мужские модели</span><span class="topdownload">топ-100 по загрузкам</span><span class="liked">топ-100 по лайкам</span></div>`;
                document.querySelector("#content > header").parentNode.insertBefore(emptyDiv, document.querySelector("#content > header").nextSibling);
                document.querySelector("#content > div.pagination").remove();
                document.querySelector("span.malefocus").addEventListener('click', function () {
                    const urls = gay_tags.map(gay_tag => `https://civitai.com/api/v1/models?limit=100&sort=Newest&types=${selectElement.value}&tag=${gay_tag}`);
                    console.log(urls);
                    fetchData(urls);
                });

                document.querySelector("span.topdownload").addEventListener('click', function () {
                    fetchData([`https://civitai.com/api/v1/models?limit=100&sort=Most Downloaded&types=` + selectElement.value]);
                });

                document.querySelector("span.liked").addEventListener('click', function () {
                    fetchData([`https://civitai.com/api/v1/models?limit=100&sort=Most Liked&types=` + selectElement.value]);
                });
            } else if (document.querySelectorAll('div.model_item').length > limit) {document.querySelector("#content > div.pagination").remove();}

            let modal = document.querySelector("div.readme_modal");
            modal.classList.add("hidden");

            let link = document.querySelector("footer > div.readme > a");
            link.addEventListener("click", function () {
                modal.classList.remove("hidden");
                setTimeout(function () {
                    let textStart = document.querySelector("#content > div.readme_modal > div.readme_modal_content > h3");
                    textStart.scrollIntoView({ behavior: "smooth" });
                }, 100);
            });

            let closeLink = document.createElement("a");
            closeLink.textContent = "ясно!";
            closeLink.addEventListener("click", function () {
                modal.classList.add("hidden");
            });
            document.querySelector("div.readme_modal_content").appendChild(closeLink);

        }).catch(error => {
            hideLoader();
            let errorDiv = document.createElement('div');
            errorDiv.className = 'error_container';
            document.querySelector("#content").appendChild(errorDiv);
            let content = `<div>даные с civitai не удалось получить: <span>«${error}»</span></div><div>это значит что проблема на сторне api civitai или их сервер снова упал, либо у тебя проблемы с сетью, или настройками маня-безопастности браузера - подробности можешь посмотреть в консоли браузера: <code><span>Ctrl</span> + <span>Shift</span> + <span>I</span><code></div>`;
            let errorElement = document.createElement('div');
            errorElement.className = 'error';
            errorElement.innerHTML = content;
            errorDiv.appendChild(errorElement);
            let countdownElement = document.createElement('div');
            countdownElement.className = 'countdown';
            let seconds = 10;
            countdownElement.innerHTML = `страница перезагрузится через <span>${seconds}</span> секунд`;
            errorDiv.appendChild(countdownElement);
            let intervalId = setInterval(() => {
                seconds--;
                countdownElement.innerHTML = `страница перезагрузится через <span>${seconds}</span> секунд`;
                if (seconds === 0) {
                    clearInterval(intervalId);
                    location.reload();
                    console.log('перезагрузка')
                }
            }, 1000);
        });
}

fetchData([baseUrl]);

// - - //

function hideLoader() {
    loader.style.display = 'none';
    loader.style.backdropFilter = 'blur(0px)'
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

function showLoader() {
    loader.style.display = 'flex';
    loader.style.backdropFilter = 'blur(10px)';
}

function generatePagination(currentPage, totalPages, ModelsSelectedType) {
    let content = '<div class="pagination"><ul class="pages">';
    const firstPage = Math.max(1, currentPage - 2);
    const lastPage = Math.min(totalPages, currentPage + 2);

    if (firstPage > 1) {
        for (let i = 1; i <= Math.min(5, firstPage - 1); i++) {
            content += `<li class="page_number"><a href="#" onclick="fetchData(['https://civitai.com/api/v1/models?limit=${limit}&sort=Newest&types=${ModelsSelectedType}&page=${i}']);return false;">${i}</a></li>`;
        }
        if (firstPage > 6) {
            content += `<li class="page_number">...</li>`;
        }
    }

    for (let i = firstPage; i <= lastPage; i++) {
        if (i === currentPage) {
            content += `<li class="page_number current_page">${i}</li>`;
        } else {
            content += `<li class="page_number"><a href="#" onclick="fetchData(['https://civitai.com/api/v1/models?limit=${limit}&sort=Newest&types=${ModelsSelectedType}&page=${i}']);return false;">${i}</a></li>`;
        }
    }

    if (lastPage < totalPages) {
        if (lastPage < totalPages - 5) {
            content += `<li class="page_number">...</li>`;
        }
        for (let i = Math.max(lastPage + 1, totalPages - 4); i <= totalPages; i++) {
            content += `<li class="page_number"><a href="#" onclick="fetchData(['https://civitai.com/api/v1/models?limit=${limit}&sort=Newest&types=${ModelsSelectedType}&page=${i}']);return false;">${i}</a></li>`;
        }
    }

    content += '</ul></div>';
    return content;
}

function lesstext(textelement, max) {
    for (var i = 0; i < textelement.length; i++) {
        (function () {
            if (localStorage.getItem("wide_normal_width") && localStorage.getItem("wide_normal_width") === "true"){max = 1100}
            var promptElement = textelement[i];
            var text = promptElement.textContent;
            if (text.length > max) {
                var textElement = document.createElement('span');
                var truncatedText = text.slice(0, max) + '...';
                textElement.textContent = truncatedText;
                promptElement.textContent = '';
                promptElement.appendChild(textElement);
                var showMoreLink = document.createElement('a');
                showMoreLink.setAttribute("class", "show_more")
                showMoreLink.textContent = 'показать больше';
                showMoreLink.href = '#';
                showMoreLink.addEventListener('click', function (event) {
                    event.preventDefault();
                    textElement.textContent = text;
                    showMoreLink.style.display = 'none';
                    showLessLink.style.display = 'inline';
                });
                promptElement.appendChild(showMoreLink);
                var showLessLink = document.createElement('a');
                showLessLink.setAttribute("class", "show_less")
                showLessLink.textContent = 'показать меньше';
                showLessLink.href = '#';
                showLessLink.style.display = 'none';
                showLessLink.addEventListener('click', function (event) {
                    event.preventDefault();
                    textElement.textContent = truncatedText;
                    showMoreLink.style.display = 'inline';
                    showLessLink.style.display = 'none';
                });
                promptElement.appendChild(showLessLink);
            }
        })();
    }
}

function url_copier(LinkSelectors, URLattribute) {
    var LinkSelectors = document.querySelectorAll(LinkSelectors);
    for (var i = 0; i < LinkSelectors.length; i++) {
        var LinkSelector = LinkSelectors[i];
        LinkSelector.addEventListener('click', function (event) {
            event.preventDefault();
            var modelUrl = event.target.getAttribute(URLattribute);
            navigator.clipboard.writeText(modelUrl);
            var originalText = event.target.textContent;
            event.target.textContent = 'скопировано!';
            setTimeout(function () {
                event.target.textContent = originalText;
            }, 2000);
        });
    }
}

const createUpArrow = () => {
    const upArrowDiv = document.createElement('div');
    upArrowDiv.setAttribute('class', 'up_arrow');
    upArrowDiv.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 559.39 718.42"><style>@keyframes draw{ to{ stroke-dashoffset: 0}} #UParrow{cursor:pointer; stroke:#ffffffdb} /* svg, g, path{fill:transparent; color:transparent} */ #backdrop{cursor:pointer} </style><g id="UParrow"><path class="balls" d="m238.52,665c-84.82,83.26-231.91,22.31-231.51-98-.26-74.29,60.5-136.59,136.5-136.5l-20.74,1.6c84.98-13.83,162.72,57.37,157.06,142.82,0,75.39,61.11,136.5,136.5,136.5,142.91-1.63,187.76-190.44,63.9-257.15-49.98-28.02-119.69-17.5-159,22.61" fill="transparent" stroke-linecap="round" stroke-linejoin="round" stroke-width="14"/><path class="shaft" d="m143.19,400.15V143.5c0-75.39,61.11-136.5,136.5-136.5s136.5,61.11,136.5,136.5v256.65" fill="transparent" stroke-linecap="round" stroke-linejoin="round" stroke-width="14"/><path class="glans" d="m416.19,184.09c-39.9,23.93-86.59,37.71-136.5,37.71s-96.6-13.77-136.5-37.71" fill="transparent" stroke-linecap="round" stroke-linejoin="round" stroke-width="14"/></g><path id="arrow" d="m214.44,182.19c26.98-25.08,48.73-53.96,65.26-86.65,19.17,33.44,41.71,62.61,68.27,86.65" fill="transparent" stroke="#ffffffdb" stroke-linecap="round" stroke-linejoin="round" stroke-width="13"/><rect id="backdrop" fill="transparent" cursor="pointer" width="559.4" height="718.4"/>
    </svg>`;
    document.querySelector("#content").insertAdjacentElement('afterend', upArrowDiv);
    return upArrowDiv;
}
const toggleUpArrowVisibility = (upArrowDiv) => {
    upArrowDiv.style.display = (window.scrollY >= window.innerHeight / 4) ? "block" : "none";
};
const scrollToTop = () => {
    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
};
const observeUpArrow = (upArrowDiv) => {
    const targetNode = document.querySelector("#content");
    const config = { childList: true, subtree: true };
    const callback = (mutationsList, observer) => {
        for (let mutation of mutationsList) {
            if (mutation.type === "childList") {
                observer.disconnect();
                upArrowDiv.addEventListener("click", scrollToTop);
            }
        }
    };
    const observer = new MutationObserver(callback);
    observer.observe(targetNode, config);
};
const UpArrowButton = () => {
    const upArrowDiv = createUpArrow();
    upArrowDiv.addEventListener("click", scrollToTop);
    observeUpArrow(upArrowDiv);
    window.addEventListener("scroll", () => toggleUpArrowVisibility(upArrowDiv));
    const svg = document.querySelector('svg');
    const UParrow = document.getElementById('UParrow');
    UParrow.style.opacity = 0;
    const backdrop = document.getElementById('backdrop');
    let isAnimated = false;
    UParrow.style.opacity = 0;
    UParrow.style.pointerEvents = 'none';
    function startUpArrowAnimation() {
        if (!isAnimated) {
            UParrow.style.opacity = 1;
            UParrow.style.pointerEvents = 'auto';
            const paths = UParrow.querySelectorAll('path');
            paths.forEach((path, index) => {
                const length = path.getTotalLength();
                path.style.strokeDasharray = length;
                path.style.strokeDashoffset = length;
                path.style.animation = 'draw 1s ease forwards ' + (index * 0.2) + 's';
            });
            isAnimated = true;
        } else {
            UParrow.querySelectorAll('path').forEach(path => path.style.animation = 'none');
            setTimeout(() => {
                const paths = UParrow.querySelectorAll('path');
                paths.forEach((path, index) => {
                    const length = path.getTotalLength();
                    path.style.strokeDasharray = length;
                    path.style.strokeDashoffset = length;
                    path.style.animation = 'draw 1s ease forwards ' + (index * 0.2) + 's';
                });
            }, 10);
        }
    }

    function hideUParrow() {
        UParrow.style.opacity = 0;
        UParrow.style.pointerEvents = 'none';
        isAnimated = false;
        UParrow.querySelectorAll('path').forEach(path => path.style.animation = 'none');
    }
    backdrop.addEventListener('mouseover', startUpArrowAnimation);
    backdrop.addEventListener('mouseout', hideUParrow);
    backdrop.addEventListener('mouseleave', hideUParrow);
};

// - - //

const headerTextObserver = new MutationObserver(mutations => {
    mutations.forEach(mutation => {
        if (mutation.type === "childList") {
            const ModelTypeHeader = document.querySelector("header > div.modeltype_header");
            if (ModelTypeHeader) {
                window.addEventListener('resize', () => {
                    if (window.innerWidth < 1120) {
                        ModelTypeHeader.textContent = '';
                    } else if (window.innerWidth < 1680 && window.innerWidth >= 1120) {
                        ModelTypeHeader.textContent = ModelTypeHeader.getAttribute('trimmed');
                    } else if (window.innerWidth >= 1680) {
                        ModelTypeHeader.textContent = ModelTypeHeader.getAttribute('title');
                    }
                });
            }
        }
    });
});
headerTextObserver.observe(document.body, { childList: true, subtree: true });

let textarea;
let clearLink;
let switchCheckbox;
const clipboardCheckboxObserver = new MutationObserver(mutations => {
    mutations.forEach(mutation => {
        if (mutation.type === "childList") {
            switchCheckbox = document.querySelector("#clipboard_switch");
            if (switchCheckbox && !textarea && !clearLink) {
                clipboardPanel = document.createElement("div");
                clipboardPanel.setAttribute('class', 'clipboard_panel')
                document.body.appendChild(clipboardPanel);
                textarea = document.createElement("textarea");
                clipboardPanel.appendChild(textarea);

                clearLink = document.createElement("a");
                clearLink.textContent = "очистить";
                clearLink.addEventListener("click", function () {
                    textarea.value = "";
                    localStorage.setItem("clipboardText", "");
                });
                clipboardPanel.appendChild(clearLink);
                if (localStorage.getItem('checkboxState') === 'true') {
                    switchCheckbox.checked = true;
                    clipboardPanel.style.display = "flex";
                    textarea.value = localStorage.getItem("clipboardText") || "";
                } else {
                    switchCheckbox.checked = false;
                    clipboardPanel.style.display = "none";
                }
            }
        }
    });
});

clipboardCheckboxObserver.observe(document.body, { childList: true, subtree: true });

const withoutAnimeCheckboxObserver = new MutationObserver(mutations => {
    mutations.forEach(mutation => {
        if (mutation.type === "childList") {
            let withoutAnimeCheckbox = document.querySelector("#without_anime");
            if (withoutAnimeCheckbox) {
                withoutAnimeCheckbox.checked = localStorage.getItem("without_anime") === "true";

                withoutAnimeCheckbox.addEventListener("change", function () {
                    localStorage.setItem("without_anime", withoutAnimeCheckbox.checked);
                });
                if (localStorage.getItem("without_anime") === "true") {
                    withoutAnimeCheckbox.checked = true;
                } else {
                    withoutAnimeCheckbox.checked = false;
                }
            }
        }
    });
});
withoutAnimeCheckboxObserver.observe(document.body, { childList: true, subtree: true });

document.addEventListener('click', function () {
    if (switchCheckbox) {
        switchCheckbox.addEventListener("change", function () {
            if (switchCheckbox.checked) {
                clipboardPanel.style.display = "flex";
                textarea.value = localStorage.getItem("clipboardText") || "";
            } else {
                clipboardPanel.style.display = "none";
                textarea.value = "";
                localStorage.setItem("clipboardText", "");
            }
            localStorage.setItem('checkboxState', switchCheckbox.checked);
        });
    }
});

let lastClipboardText = "";
async function readClipboard() {
    if (!switchCheckbox.checked) return;
    try {
        let clipboardText = await navigator.clipboard.readText();
        if (clipboardText.startsWith("https://civitai.com/api/download/models/") && clipboardText !== lastClipboardText) {
            let lines = textarea.value.split("\n");
            if (!lines.includes(clipboardText)) {
                textarea.value += "\n" + clipboardText;
                localStorage.setItem("clipboardText", textarea.value);
            }
            lastClipboardText = clipboardText;
        }
    } catch (e) {
        console.error(e);
    }
}
document.addEventListener("click", function () {
    readClipboard();
});

setInterval(function () {
    if (switchCheckbox) {
        if (localStorage.getItem('checkboxState') === 'true') {switchCheckbox.checked = true;} else {switchCheckbox.checked = false;}
        readClipboard();
    }
}, 1000);

const changeWidthCheckboxObserver = new MutationObserver(mutations => {
    let changeWidthCheckbox = document.querySelector("#wide_normal_width");
    mutations.forEach(mutation => {
        if (mutation.type === "childList") {
            if (changeWidthCheckbox) {
                changeWidthCheckbox.checked = localStorage.getItem("wide_normal_width") === "true";

                changeWidthCheckbox.addEventListener("change", function () {
                    localStorage.setItem("wide_normal_width", changeWidthCheckbox.checked);
                    updateModelItemStyles(changeWidthCheckbox.checked);
                });
                updateModelItemStyles(changeWidthCheckbox.checked);
            }
        }
    });
});
changeWidthCheckboxObserver.observe(document.body, { childList: true, subtree: true });

function updateModelItemStyles(checked) {
    let modelItems = document.querySelectorAll("#content > div.model_item");
    if (checked) {
        modelItems.forEach(item => {
            item.style.width = "calc(100vw - 100px)";
            item.style.maxWidth = "1826px";
            item.style.transition = "0s"
        });
    } else {
        modelItems.forEach(item => {
            item.style.width = "";
            item.style.maxWidth = "";
        });
    }
}

window.addEventListener("load", () => {
    let changeWidthCheckbox = document.querySelector("#wide_normal_width");
    let checked = localStorage.getItem("wide_normal_width") === "true";
    if (changeWidthCheckbox) {
        changeWidthCheckbox.checked = checked;
    }
    updateModelItemStyles(checked);
});

// - - //

var server_code_example = `
<pre class="codeblock">
<code id="htmlViewer" style="color:#e6e1dc;font-weight:400;background-color:#232323;background:#232323;display:block;padding:.5em"><span class="codeline" style="color:#c26230;font-weight:400">import</span> os, webbrowser
<span class="codeline" style="color:#c26230;font-weight:400">from</span> http.server <span class="codeline" style="color:#c26230;font-weight:400">import</span> HTTPServer, SimpleHTTPRequestHandler
os.chdir(os.path.expanduser(<span class="codeline" style="color:#a5c261;font-weight:400">&#x27;~\\Desktop\\civitai_client&#x27;</span>)) <span class="codeline" style="color:#bc9458;font-weight:400"># предположим, что index.html в папке civitai_client на рабочем столе Windows</span>
httpd = HTTPServer((<span class="codeline" style="color:#a5c261;font-weight:400">&#x27;localhost&#x27;</span>, <span class="codeline" style="color:#a5c261;font-weight:400">8000</span>), SimpleHTTPRequestHandler)
webbrowser.<span class="codeline" style="color:#6d9cbe;font-weight:400">open</span>(<span class="codeline" style="color:#a5c261;font-weight:400">f&quot;http://localhost:8000&quot;</span>, new=<span class="codeline" style="color:#a5c261;font-weight:400">2</span>) <span class="codeline" style="color:#bc9458;font-weight:400"># и автоматически откроем локальный сайт</span>
httpd.serve_forever()</code>
</pre>
`
var about = `
<div class="readme_modal"><div class="readme_modal_content"><h3 class="readme_modal_header">это легковесный веб-клиент для civitai.com на JS</h3><ul><li>зачем это и почему? <ul><li>оригинальный сайт CivitAI очень тормозной;</li><li>на CivitAI бесконечная прокрутка страницы с моделями, которая только усугубляет тормоза;</li><li>ебанутый поиск на CivitAI который ищет либо только по тегам либо по названиям;</li><li>перегруженный интерфейс CivitAI который мешает делать для чего сайт предназначен: найти модель и получить ссылку.</li></ul></li><li>как это? <ul><li>JS получает по api данные в json и на их основе формирует страницы;</li><li>сам "сайт" никаких данных не содержит, все получается в реальном времени с CivitAI прямо на стороне браузера пользователя;</li><li>из выдачи удаляются все модели которые нельзя скачать: архивные, удаленные, с ранним платным доступом;</li><li>для удобства на страницу выводится по 10 элементов, а благодаря пагинации все будет работать без тормозов даже если ты решишь просмотреть всё от первой до самой последней модели;</li><li>слева вверху можно выбрать категории: модели, лоры, ликорисы, внедрения, ваэ, гиперсети, контролнет, позы, другое;</li><li>верхнее меню поиска ищет только в текущей выбранной категории;</li><li>при поиске делается запрос сразу на выдачу результатов как по тегам, так и по названию моделей, так и по свободному запросу - все это потом формируется в единый результат на странице;</li><li>если в карточке модели указаны теги, по ним пожно кликать и получать все модели по данному тегу; </li><li>название модели - кликабельно: по умолчанию при клике копируется прямая ссылка на загрузку последней версии в буфер обмена;</li><li>справа стрелочка - скачивание последней версии;</li><li>под названием модели можно выбрать все имеющиеся версии модели и также скопировать прмямую ссылку на загрузки при клике;</li><li>можно включить опцию для копирования ссылок в один список по кнопке в шапке, чтобы потом использовать его для загрузки, например, в колабе или какой-нибудь качалке;</li><li>из выдачи можно удалить элементы с тегом "anime" - достаточно переключить аниме-глаз в шапке на человеческий;</li><li>по умолчанию на страницу подгружаются небольшие картиночки, но по ним можно кликать чтобы открыть максимально возможный размер;</li><li>над превьюшками расположены кнопки-стрелочки: их можно нажимать для перелистывания картинок (я решил ограничить их количество пятью) вместе с их параметрами генерации (если они доступны), а если стрелочек нет, значит картинка только одна;</li><li>внизу есть спойлер "описание и дополнительная информация" - чтобы почитать оригинальное описание, которое оставил автор (из которого я заботливо удаляю все ссылки на донаты и т.п. ерунду);</li><li>здесь не используются кукисы, а только временное локальное хранилище с названием категории при ее переключении (которое потом подставляется в функцию для пагинации);</li><li>комментарии, посты, обзоры и т.п. - удалено за ненадобностью.</li></ul></li><li>какие подводные? <ul><li>самое главное - зависимость от стабильности самого CivitAI: если он не работает (что не редко и происходит) - будет не работать этот клиент;</li><li>иногда данные по api могут долго подгружаться, или вообще CivitAI при очередном заебе выдаст html-заглушку - в таком случае, чтобы бесконечно не любоваться писюном на экране, нужно перезагрузить страницу, авось апи одуплится;</li><li>иногда полноразмерные картинки ну очень долго подгружаются - тут ничего не поделаешь, придется терпеть, как и на оригинальном сайте.</li><li>на некоторых браузерах все это может вообще не работать из-за политики CORS - клиент находится на одном домене (здесь), а данные запрашиваются с другого домена (цивитаи), что считается чем-то небезопасным, но выход найти можно: использовать нормальный браузер (точнее кастомную сбор_очку), или добавить аргумент для запуска браузера <code>--disable-web-security</code>, или установить расширение для браузера чтобы обойти ограничения на кросс-доменные запросы: <a href="https://chrome.google.com/webstore/search/Cross%20Domain%20-%20CORS?_category=extensions" target="_blank" rel="noopener noreferrer">для хроме</a> или <a href="https://addons.mozilla.org/en-US/firefox/search/?q=Cross%20Domain%20-%20CORS target="_blank" rel="noopener noreferrer">фаерфокса</a>;</li><li>поскольку это сделано для личного использования (мной), тут нет оптимизации под мобильные устройства, или, например, быстрого доступа к списку моделей по интересующей тебя теме - но никто не мешает тебе сделать копию и настроить чисто под себя.</li></ul></li><li>можно ли использовать локально? <ul><li>да, можно открывать просто html-файлик локально, либо отключив политику безопасности CORS в браузере, либо подняв простой http-сервер, например на Python это делается в пару строчек:${server_code_example} </li></ul></li><li>куда можно написать донос? <ul><li><a href="https://t.me/stabdiff" target="_blank" rel="noopener noreferrer">в эту группу</a></li></ul></li></ul></div></div>
`
var footer_content = `
<footer><div class="readme"><a>это что вообще такое и как это?</a></div><div class="links">полезные ссылки: <a href="https://t.me/Civitai_models" target="_blank" rel="noopener noreferrer">бэкап цивитаи</a> | <a href="https://colab.research.google.com/drive/1TC4SSLncPWytSPvquR6Y4-U7wZRfAXrV" target="_blank" rel="noopener noreferrer">колаб</a> | <a href="https://t.me/stabdiff" target="_blank" rel="noopener noreferrer">группа</a></div><div class="sitedescription">легковесный веб-клиент civitai.com</div></footer>${about}
`
