# bipo的svg动画效果

<image src="../.vitepress/assets/bipo-svg.png" />

``` html
<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Document</title>
  <style>
    .absolute {
      position: absolute;
    }

    .inline-block {
      display: inline-block;
    }

    .loader {
      display: flex;
      margin: 0.25em 0;
    }

    .w-2 {
      width: 0.5em;
    }

    .dash {
      --time: 12s;
      animation: dashArray var(--time) ease-in-out infinite,
        dashOffset var(--time) linear infinite;
    }

    @keyframes dashArray {
      0% {
        stroke-dasharray: 0 1 359 0;
      }

      50% {
        stroke-dasharray: 0 359 1 0;
      }

      100% {
        stroke-dasharray: 359 1 0 0;
      }
    }

    @keyframes dashOffset {
      0% {
        stroke-dashoffset: 365;
      }

      100% {
        stroke-dashoffset: 5;
      }
    }
  </style>
</head>

<body>
  <div class="loader">
    <svg height="0" width="0" viewBox="0 0 64 64" class="absolute">
      <defs class="s-xJBuHA073rTt" xmlns="http://www.w3.org/2000/svg">
        <lineargradient class="s-xJBuHA073rTt" gradientUnits="userSpaceOnUse" y2="2" x2="0" y1="62" x1="0" id="b">
          <stop class="s-xJBuHA073rTt" stop-color="#973BED"></stop>
          <stop class="s-xJBuHA073rTt" stop-color="#007CFF" offset="1"></stop>
        </lineargradient>
        <lineargradient class="s-xJBuHA073rTt" gradientUnits="userSpaceOnUse" y2="2" x2="0" y1="62" x1="0" id="i">
          <stop class="s-xJBuHA073rTt" stop-color="#973BED"></stop>
          <stop class="s-xJBuHA073rTt" stop-color="#007CFF" offset="1"></stop>
        </lineargradient>
        <lineargradient class="s-xJBuHA073rTt" gradientUnits="userSpaceOnUse" y2="0" x2="0" y1="64" x1="0" id="p">
          <!-- <stop class="s-xJBuHA073rTt" stop-color="#FFC800"></stop>
          <stop class="s-xJBuHA073rTt" stop-color="#F0F" offset="1"></stop> -->
          <stop class="s-xJBuHA073rTt" stop-color="#973BED"></stop>
          <stop class="s-xJBuHA073rTt" stop-color="#007CFF" offset="1"></stop>
        </lineargradient>
        <lineargradient class="s-xJBuHA073rTt" gradientUnits="userSpaceOnUse" y2="2" x2="0" y1="62" x1="0" id="o">
          <!-- <stop class="s-xJBuHA073rTt" stop-color="#00E0ED"></stop>
          <stop class="s-xJBuHA073rTt" stop-color="#00DA72" offset="1"></stop> -->
          <stop class="s-xJBuHA073rTt" stop-color="#973BED"></stop>
          <stop class="s-xJBuHA073rTt" stop-color="#007CFF" offset="1"></stop>
          <!-- <animatetransform repeatCount="indefinite"
            keySplines=".42,0,.58,1;.42,0,.58,1;.42,0,.58,1;.42,0,.58,1;.42,0,.58,1;.42,0,.58,1;.42,0,.58,1;.42,0,.58,1"
            keyTimes="0; 0.125; 0.25; 0.375; 0.5; 0.625; 0.75; 0.875; 1" dur="8s"
            values="0 32 32;-270 32 32;-270 32 32;-540 32 32;-540 32 32;-810 32 32;-810 32 32;-1080 32 32;-1080 32 32"
            type="rotate" attributeName="gradientTransform"></animatetransform> -->
        </lineargradient>
      </defs>
    </svg>

    <!-- B字母 -->
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 34 64" height="64" width="64" class="inline-block">
      <path stroke-linejoin="round" stroke-linecap="round" stroke-width="8" stroke="url(#b)"
        d="M 4,4 V 60 H 22 C 42,56 42,34 22,30 H 4 H 22 C 35,26 35,8 22,4 H 4 " class="dash" id="b" pathLength="360">
      </path>
    </svg>

    <!-- I字母 -->
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 34 64" height="64" width="64" class="inline-block">
      <path stroke-linejoin="round" stroke-linecap="round" stroke-width="8" stroke="url(#i)" d="M 12,60 V 4"
        class="dash" id="i" pathLength="360"></path>
    </svg>

    <!-- P字母 -->
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 64 64" height="64" width="64" class="inline-block">
      <path stroke-linejoin="round" stroke-linecap="round" stroke-width="8" stroke="url(#p)"
        d="M 4, 4 V 60 M 4, 4 H 22 C 44,8 44,35 22,39 H 4" class="dash" id="p" pathLength="360"></path>
    </svg>

    <!-- O字母 -->
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" style="--rotation-duration:0ms; --rotation-direction:normal;"
      viewBox="0 0 64 64" height="64" width="64" class="inline-block">
      <path stroke-linejoin="round" stroke-linecap="round" stroke-width="8" stroke="url(#o)" d="
    M 59 32 
    a 27 27 0 1 1 -54 0 
    a 27 27 0 1 1 54 0" class="dash" id="o" pathLength="360">
        <animate attributeName="stroke-dasharray" from="0 360" to="360 360" dur="2s" repeatCount="indefinite" />
        <animate attributeName="stroke-dashoffset" from="0" to="-180" dur="2s" repeatCount="indefinite" />
      </path>
    </svg>
  </div>
</body>

</html>
```
