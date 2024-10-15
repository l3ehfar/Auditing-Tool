<script lang="ts">
    import { caption, $imageStream as imageStream, trainingSet } from "$lib/marcelle";  
    import { onMount, onDestroy, tick } from 'svelte';
    import * as fabric from 'fabric';
    import Chart from 'chart.js/auto';
    import { marcelle } from "$lib/utils";
    import { MatrixController, MatrixElement } from 'chartjs-chart-matrix';

    Chart.register(MatrixController, MatrixElement);

    let canvas: fabric.Canvas | null = null;
    let imageObject: fabric.Image | null = null;
    let dragOverlay: HTMLDivElement | null = null;

    let aggregatedPersonFrequency = { male: 0, female: 0, chef: 0 };
    let processedCaptions = new Set<string>(); 
    let nonGenderedWordFrequency = {}; 
    let coOccurrences = { male: {}, female: {}, chef: {} }; 
    let captionInstances = { male: {}, female: {}, chef: {} };

    const stopWords = ['in', 'into', 'of', 'other', 'with', 'is', 'are', 'arafed', 'araffe', 'and', 'model', 'generated', 'caption:', 'a', 'to', 'one', 'two', 'three'];

    const genderedWords = {
        male: ['man', 'he', 'him', 'his', 'boy', 'male', 'men'],
        female: ['woman', 'she', 'her', 'hers', 'girl', 'female', 'women'],
        chef: ['chef', 'chefs']
    };

    let matrixChart;

    function updateAggregatedPersonFrequency(captionText: string) {
        if (processedCaptions.has(captionText)) {
            return;
        }

        processedCaptions.add(captionText);

        const words = captionText.toLowerCase().split(/\s+/);

        let containsGenderedWord = { male: false, female: false, chef: false };

        Object.keys(genderedWords).forEach((category) => {
            genderedWords[category].forEach((identifier) => {
                if (words.includes(identifier)) {
                    containsGenderedWord[category] = true;
                    aggregatedPersonFrequency[category] += 1;
                }
            });
        });

        const nonGenderedWords = words.filter(word =>
            !Object.values(genderedWords).flat().includes(word) && !stopWords.includes(word)
        );

        nonGenderedWords.forEach(word => {
            if (!nonGenderedWordFrequency[word]) {
                nonGenderedWordFrequency[word] = 0;
            }
            nonGenderedWordFrequency[word]++;
        });

        Object.keys(containsGenderedWord).forEach(category => {
            if (containsGenderedWord[category]) {
                nonGenderedWords.forEach(word => {
                    if (!coOccurrences[category][word]) {
                        coOccurrences[category][word] = 0;
                        captionInstances[category][word] = []; 
                    }
                    coOccurrences[category][word] += 1;
                    captionInstances[category][word].push(captionText); 
                });
            }
        });
    }

    function updateMatrixChart() {
        const mostFrequentNonGenderedWords = getMostFrequentNonGenderedWords(10);

        matrixChart.data.datasets[0].data = generateMatrixData();
        matrixChart.options.scales.x.labels = mostFrequentNonGenderedWords;
        matrixChart.update();
    }

    function generateMatrixData() {
        const data = [];
        const mostFrequentNonGenderedWords = getMostFrequentNonGenderedWords(10);
        const categories = ['male', 'female', 'chef'];

        categories.forEach((category) => {
            mostFrequentNonGenderedWords.forEach((nonGenderedWord) => {
                const frequency = coOccurrences[category][nonGenderedWord] || 0;
                if (frequency > 0) {
                    data.push({
                        x: nonGenderedWord,
                        y: category,
                        v: frequency
                    });
                }
            });
        });

        return data;
    }

    function getMostFrequentNonGenderedWords(limit: number) {
        const sortedWords = Object.entries(nonGenderedWordFrequency)
            .sort(([, a], [, b]) => b - a)
            .slice(0, limit)
            .map(([word]) => word);
        return sortedWords;
    }

    async function fetchAndProcessCaptions() {
        try {
            const allInstances = await trainingSet.sift({});

            if (allInstances.length > 0) {
                allInstances.forEach(instance => {
                    if (instance.caption) {
                        updateAggregatedPersonFrequency(instance.caption);  
                    }
                });

                updateMatrixChart();
            } else {
                console.warn("Dataset is empty.");
            }
        } catch (error) {
            console.error('Error fetching dataset instances:', error);
        }
    }

    onMount(async () => {
        const matrixCtx = document.getElementById('matrixChart').getContext('2d');
        matrixChart = new Chart(matrixCtx, {
            type: 'matrix',
            data: {
                datasets: [{
                    label: 'Word Frequency Matrix of Captions',
                    data: [], 
                    backgroundColor(context) {
                        const value = context.raw ? context.raw.v : 0;
                        return value > 0 ? `rgba(54, 162, 235, ${Math.min(1, value / 5)})` : 'rgba(0, 0, 0, 0.1)';
                    },
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1,
                    width(context) {
                        const chart = context.chart;
                        const xAxis = chart.scales.x;
                        return (xAxis.width / xAxis.ticks.length) - 2;
                    },
                    height(context) {
                        const chart = context.chart;
                        const yAxis = chart.scales.y;
                        return (yAxis.height / yAxis.ticks.length) - 2;
                    }
                }]
            },
            options: {
                scales: {
                    x: {
                        type: 'category',
                        labels: getMostFrequentNonGenderedWords(10), 
                        offset: true,
                        title: {
                            display: true,
                            text: 'Frequent Words'
                        }
                    },
                    y: {
                        type: 'category',
                        labels: ['male', 'female', 'chef'],
                        offset: true,
                        title: {
                            display: true,
                            text: 'Person Identifiers'
                        }
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            title() {
                                return '';
                            },
                            label(context) {
                                const { x, y, v } = context.raw || {};
                                const instances = captionInstances[y][x] || [];
                                return [
                                    `Frequent Word: ${x}`,
                                    `Identified Person: ${y}`,
                                    `Count: ${v || 0}`,
                                ];
                            }
                        }
                    }
                }
            }
        });

        await fetchAndProcessCaptions();

        await tick();

        const canvasEl = document.querySelector('#fabric-canvas') as HTMLCanvasElement;
        const width = 200;
        const height = 200;

        canvas = new fabric.Canvas(canvasEl, {
            isDrawingMode: false,
            width: width,
            height: height,
        });

        dragOverlay = document.querySelector('#drag-overlay');

        if (dragOverlay) {
            dragOverlay.addEventListener('dragstart', onDragStart);
        }

        imageStream.filter(img => !!img).subscribe((img) => {
            loadImageToCanvas(img);
        });

        caption.$value.subscribe((captionText) => {
            if (captionText) {
                updateAggregatedPersonFrequency(captionText);
                updateMatrixChart(); 
            }
        });
    });

    onDestroy(() => {
        if (dragOverlay) {
            dragOverlay.removeEventListener('dragstart', onDragStart);
        }
    });

    function loadImageToCanvas(img: ImageData) {
        if (canvas) {
            canvas.clear();

            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = img.width;
            tempCanvas.height = img.height;

            const ctx = tempCanvas.getContext('2d');
            if (ctx) {
                ctx.putImageData(img, 0, 0);

                const imgElement = new Image();
                imgElement.src = tempCanvas.toDataURL();

                imgElement.onload = function () {
                    if (canvas) {
                        if (imageObject) {
                            canvas.remove(imageObject);
                        }

                        imageObject = new fabric.Image(imgElement, {
                            left: 0,
                            top: 0,
                            selectable: false,
                            evented: false,
                        });

                        canvas.add(imageObject);
                        canvas.renderAll();
                    }
                };
            }
        }
    }

    function onDragStart(event: DragEvent) {
        const canvasElement = document.querySelector('#fabric-canvas') as HTMLCanvasElement;
        const currentCaption = caption.$value.get(); 

        if (canvasElement) {
            const canvasUrl = canvasElement.toDataURL('image/png');
            const data = JSON.stringify({
                type: 'image-caption',
                src: canvasUrl,
                caption: currentCaption || "No caption generated"
            });

            event.dataTransfer?.setData('text/plain', data);
        } else {
            console.error('Canvas element not found');
        }
    }
</script>


<div class="marcelle card">
    <div class="conf-row">
        <div class="group-components-container instax-style" draggable="true" on:dragstart={onDragStart}>
            <div class="canvas-container">
                <canvas id="fabric-canvas" width="200" height="200"></canvas>
                <div id="drag-overlay" class="drag-overlay"></div>
            </div>
            <div class="marcelle-component caption" use:marcelle={caption}></div>
        </div>
        <div class="flex flex-col items-center gap-2">
                <canvas id="matrixChart" width="400" height="220"></canvas>
        </div>
    </div>
</div>


<style>
    .marcelle.card {
        display: flex;
        flex-direction: column;
        height: 100%;
        box-sizing: border-box;
        width: 100%;
        align-items: center;
    }

    .btn {
        font-size: 0.7rem;
        font-weight: normal;
    }

    .marcelle-component.caption {
        font-size: 0.8rem;
        color: var(--heading-color);
        padding: 5px;
        text-align: center;
        border: none;
    }

    .conf-row {
        display: flex;
        gap: 10px;
        height: 100%; 
        align-items: center;
    }

    .marcelle-component {
        border: 1px solid #ddd;
        border-radius: 5px;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .canvas-container {
        position: relative;
        width: 200px;
        height: 200px;
    }

    canvas {
        width: 100%;
        height: 100%;
        pointer-events: auto;
        z-index: 10;
        background-color: transparent;
    }

    .drag-overlay {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: transparent;
        z-index: 20;
        cursor: grab;
    }

    .group-components-container {
        display: flex;
        flex-direction: column; 
        gap: 5px; 
        align-items: center;
    }

    .instax-style {
        background-color: #fff;
        border: 1px solid #ddd;
        border-radius: 8px;
        padding: 10px;
        box-shadow: 0 1px 1px rgba(0, 0, 0, 0.4);
        width: 220px;
        height: 270px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: flex-start;
    }
    
</style>
