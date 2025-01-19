//initDB
const _dbName = "nouns";
const _dbVersion = 1;
const _tableName = "word_";
const _nounsFileName = "/nouns.txt";
const _nounsAticleId= "nouns";

//camera
const _svgNS = "http://www.w3.org/2000/svg";
const _svgCanvas = document.getElementById("canvasId");
const _pointD = 10;
const _dmax = 5;
const _canvas = new Canvas();

//anagram
const _method = 'get';
const _letter = 'letterCls';
const _stack = 'stackId';
const _word = 'wordId';
const _utf16Ln = 16;//utf16 16 bit
const _biasLn = 4;//max 4 bits on word.length
const _nill = '0';
const _anagramIdTimeout = 750;//2000ms 2s
const _marginEnd= '0px';
const _marginStart = '100%';
const _visibilityShow= 'visible';
const _visibilityHide = 'hidden';
const _maxWordLen = 15;
const _minWordLen = 5;

async function Init()
{    
    await LocalStorageDbInit(_dbName);
    ControlsInit();
    svgCanvasInit();
    letterStackInit();
}

async function LocalStorageDbInit(name)
{
    let dbs =  await indexedDB.databases();
    if(!dbs.find(db=>db.name==name))
        {
            let nouns = loadWordsByLen(_nounsAticleId);

            let dbrq = indexedDB.open(_dbName, _dbVersion);
            FillDB(dbrq, nouns);
        }
}
function letterStackInit()
{
    let wordDiv = document.getElementById('lettersId');
    wordDiv.addEventListener('click',newWord);
    wordDiv.dispatchEvent(new Event('click'));

    let stackDiv = document.getElementById('stackId');
    stackDiv.addEventListener('click',showLetter);

    let anagramDiv = document.getElementById('anagramId');
    anagramDiv.addEventListener('click',newLevel);
}
function ControlsInit()
{
    leftRangeInit();
    rightRangeInit();
    cameraControlInit();
}
function leftRangeInit()
{
    let minLen = localStorage.getItem("minLen");   
    let maxLen = localStorage.getItem("maxLen");
    let minLevelValue = localStorage.getItem("minLevelValue");

    let minLevelRange = document.getElementById('minLevel');
    
    minLevelRange.min = +minLen;
    minLevelRange.value = +minLevelValue;
    minLevelRange.max = +maxLen;

    minLevelRange.oninput = function(e)
    {
        let minLevelRange = e.currentTarget;
        localStorage.setItem("minLevelValue", minLevelRange.value);

        let minLevelOut = document.getElementById('minLevelOut');
        minLevelOut.innerText = minLevelRange.value;
    }
    minLevelRange.onclick = function(e){e.stopPropagation();}
    minLevelRange.dispatchEvent(new Event ("input"));   
}
function rightRangeInit()
{
    let minLen = localStorage.getItem("minLen");  
    let maxLen = localStorage.getItem("maxLen");
    let maxLevelValue = localStorage.getItem("maxLevelValue");

    let maxLevelRange = document.getElementById('maxLevel');
    maxLevelRange.min = +minLen;
    maxLevelRange.value = maxLevelValue;
    maxLevelRange.max = +maxLen;

    maxLevelRange.oninput = function(e)
    {
        let maxLevelRange = e.currentTarget;
        localStorage.setItem("maxLevelValue", maxLevelRange.value);
        let minLevelRange = document.getElementById('minLevel');

        if(+maxLevelRange.value < +minLevelRange.value)
            {
                maxLevelRange.value = minLevelRange.value;
            }
            let maxLevelOut = document.getElementById('maxLevelOut');
            maxLevelOut.innerText = maxLevelRange.value;
    }
    maxLevelRange.onclick = function(e){e.stopPropagation();}
    maxLevelRange.dispatchEvent(new Event ("input"));   
}

function cameraControlInit()
{
    let cameraLevelMax = document.getElementById('cameraLevelMax');
    let cameraLevelMaxValue = localStorage.getItem('cameraLevelMaxValue');

    cameraLevelMax.value = cameraLevelMaxValue==null?1:cameraLevelMaxValue;
    cameraLevelMax.addEventListener('input',function(e)
    {
        let cameraLevelMax = e.currentTarget;
        localStorage.setItem('cameraLevelMaxValue', cameraLevelMax.value);
    },true);
    cameraLevelMax.onclick = function(e){e.stopPropagation();}

    let cameraLevel = document.getElementById('cameraLevel');
    let cameraLevelValue = localStorage.getItem('cameraLevelValue');

    cameraLevelValue = cameraLevelValue===null?1:cameraLevelValue;
    cameraLevel.value =  +cameraLevelValue >= +cameraLevelMaxValue?+cameraLevelMaxValue:+cameraLevelValue;

    cameraLevel.addEventListener('input',function(e)
    {
        let cameraLevel = e.currentTarget;
        localStorage.setItem('cameraLevelValue', cameraLevel.value);
    },true);
    cameraLevel.onclick = function(e){e.stopPropagation();}


}
function svgCanvasInit()
{
    let startLevel = document.getElementById("cameraLevel").value;
    _canvas.startFrom(startLevel);
}


//Camera mind
function Point(x,y,active)
{
    this.x = x;
    this.y = y;
    this.active = active;
}

function Canvas()
{
    this.svg = _svgCanvas;
    this.gridStep  = _pointD;
    this.gridX = Math.floor(_svgCanvas.clientWidth / this.gridStep,0);
    this.gridY = Math.floor(_svgCanvas.clientHeight / this.gridStep,0);

    this.grid = new Array();
    this.init=function()
    {
        for(let x = 0; x < this.gridX; x++)
        {
            this.grid[x] = new Array() ;

            for(let y = 0; y < this.gridY; y++)
            {
                this.grid[x][y] = new Point(x,y,false); 
            }
        }
    }
    this.init();

    this.checkBounds = function(x,y,d)
    {
        let dd =d;
        let dm = d;
        let dc = 0;
        let cd = dd;
        let xd = x;
        let yd = y;
        let xdm =x;
        let ydm = y;

        for(let i= x; i<x+dd; i++)
        {
            for(let j=y; j<y+dd; j++)
            {
                if(this.grid[i][j].active) 
                {
                    xd = i-x;
                    yd = j-y;
                    dc = Math.floor(Math.sqrt(xd*xd + yd*yd));

                    if( dc<cd )
                    {
                        cd = dc;
                        xdm = xd;
                        ydm= yd;
                        dm = xdm>ydm?xdm:ydm;
                    }
                }
            }
        }
        return dm;
    }

    this.putCircle = function(x,y,d,active)
    {
        let xd = +x+d>this.grid.length?this.grid.length-x:+d;
        let yd = +y+d>this.grid[0].length?this.grid[0].length-y:+d;
        let dd = xd<yd?xd:yd;

        let r =  this.checkBounds(x,y,dd)/2;
        let xc = x+r;
        let yc = y+r;
        let dx = 0;
        let dy = 0;
        let rc = 0;

        for(let i= xc-r; i<xc+r; i++)
            {
                for(let j=yc-r; j<yc+r; j++)
                {
                    dx = Math.abs(xc-i);
                    dy = Math.abs(yc-j);
                    rc = Math.floor(Math.sqrt(dx*dx + dy*dy));
                    this.grid[i][j].active = rc<=r;
                }
            }

        this.drawCircle(xc * _pointD, yc * _pointD,  r *_pointD,active);

    }
    this.circleId = 0;
    this.drawCircle = function (cx,cy,r,active)
    {
        let  circle = document.createElementNS( _svgNS, "circle");
        circle.setAttribute('active',active);
        circle.setAttribute('id', this.circleId++);
        circle.setAttribute('cx', cx);
        circle.setAttribute('cy', cy);
        circle.setAttribute('r', r);
        circle.setAttribute('fill','white');

        circle.onclick = function(e)
        {
            let circle = e.currentTarget;
            let active = circle.getAttribute("active")=='true';
            if(active)
                {
                    circle.setAttribute('active','false');
                    nextLevel(_marginEnd);
                    ++_svgCanvas.currentLevel;
                }
            else
                {
                    let startLevel = document.getElementById("cameraLevel").value;
                    let endLevel = document.getElementById("cameraLevelMax").value;
                    
                    if(_svgCanvas.currentLevel>+endLevel)
                        {
                            _canvas.init();
                            _canvas.startFrom(startLevel);
                        }
                        else
                        {
                            _svgCanvas.removeChild(_svgCanvas.lastChild);
                            nextLevel(_marginEnd);
                        }
                }
                console.clear();
                console.log(e.target);
                e.stopPropagation();
        }
        _svgCanvas.appendChild(circle);
    }
 
    this.newRandomCircle = function(active)
    {
        let filteredPoints = new Array();
        let res = null;
        for(let str in this.grid)
        {
            res = this.grid[str].filter(el=>!el.active);
            if(res.length>0) filteredPoints.push(res);
        }

        if (filteredPoints.length==0) return false;

        let xMax = filteredPoints.length -1 ;
        let xrand = Math.round(Math.random()*xMax) ;  

        let yMax = filteredPoints[xrand].length -1;
        let yrand = Math.round(Math.random()*yMax);  
        
        let rRand = Math.floor(Math.random()*_dmax);
        ++rRand;

        point = filteredPoints[xrand][yrand];
        
       this.putCircle(point.x,point.y, rRand,active);
    }
    this.currentLevel = 0;
    this.startFrom = function(level)
    {
        this.svg.innerHTML = '';
        _svgCanvas.currentLevel = 0;
        for(let i=0;i<level;i++)
            {
                _canvas.newRandomCircle(false);
                ++_svgCanvas.currentLevel;
            }
            _canvas.svg.addEventListener('click',function(e){
            e.stopPropagation();
            nextLevel(_marginEnd);

        },{once:true});
    }
}
function newLevel()
{
    nextLevel(_marginStart);
    showLetter();
    _canvas.newRandomCircle(true);

}

function nextLevel(position)
{
   let anagram = document.getElementById('anagramId');
   if(position == _marginEnd)
    {
        anagram.style.visibility = _visibilityShow;
    }
    else if(position == _marginStart)
    {
        setTimeout(function(){
            anagram.style.visibility = _visibilityHide;
        },_anagramIdTimeout)
    }
    else throw Error("Wrong anagram position.");

    anagram.style.marginLeft = position;

    let letters = document.getElementById('lettersId');
    return position;
}


//Anagram+
 function loadWordsByLen(nounsAticleId){
    let nounsAticle = document.getElementById(nounsAticleId);
  
    function getNouns()
    {
         let nouns = nounsAticle.innerText.split('\n');    

         let maxLen = 0;
         for(word of nouns)
             {
                maxLen = word.length>maxLen?word.length:maxLen;
             }
         let minLen = maxLen;
         for(word of nouns)
             {
                minLen = word.length<minLen && word.length>0?word.length:minLen;
             }                
         

            if(minLen < _minWordLen)
                {
                    localStorage.setItem('minLen',_minWordLen);
                }
            else
                {
                    localStorage.setItem('minLen',minLen);
                }

            if(maxLen >_maxWordLen)
                {
                    localStorage.setItem('maxLen',_maxWordLen);
                }
            else
                {
                    localStorage.setItem('maxLen', maxLen);
                }
            

         let wordsByLen = new Array();
         for(let i =minLen;i<maxLen;i++)
         {
             wordLen = new Array();
             for(word of nouns)
                 {
                     if(word.length == i) wordLen.push(word);
                 }
             wordsByLen.push(wordLen);
         }
         return wordsByLen;
    }
    return getNouns();
}

function FillDB(dbrq, nouns)
{
    dbrq.onupgradeneeded = function(event)
    {
        let db = dbrq.result;
        let names = db.objectStoreNames;
        let name = null;
        let table = null;
    
        for(noun of nouns)
            {
                if(noun.length>0)
                    {
                        name =  _tableName + noun[0].length;
                        if(names.contains(name))
                            {
                                table = db.transaction.objectStore(name);
                            }
                        else
                            {
                                table = db.createObjectStore(name,{autoIncrement:true});
                            }
                            
                            for(word of noun)
                                {
                                    table.add(word);
                                }
                       
                    }
    
            }
    } 
}

 function getWord(minLen, maxLen)
{
    let nounsRq = indexedDB.open(_dbName, _dbVersion);

    nounsRq.onsuccess = function(event)
    {
        let range = maxLen - minLen;
        let wordLen = +minLen + Math.round(Math.random()*range); 

        let transaction = event.target.result.transaction(_tableName + wordLen);
        let store = transaction.objectStore(_tableName + wordLen);

        let countRq =   store.count();
        countRq.onsuccess = function(event)
        {
            let wordCount = event.target.result -1;
            let index = Math.round(Math.random()*wordCount);
            let wordRq =   store.get(index)
            wordRq.onsuccess = function(event)
            {
                let word =  event.target.result;
                localStorage.setItem('word',event.target.result);
                let wordhash = getHash(word).toString();
                localStorage.setItem('wordHash',wordhash);
                let mixedWordHash = mixWord(wordhash,',');
                localStorage.setItem('mixedWordHash',mixedWordHash);
                let mixedWord = getHashedWord(mixedWordHash.split(','));
                localStorage.setItem('mixedWord',mixedWord);
                let indexes = new Array();

                for(let i=0; i<word.length; i++)
                    {
                        indexes.push(i);
                    }
                    localStorage.setItem('index', indexes);
                printWord(mixedWord);
            }
        }
    }
}

function printWord(word)
{
   
    let maxLen = localStorage.getItem('maxLen');
    let wordDiv =document.getElementById(_word);
    let width = +getComputedStyle(wordDiv).width.replace('px','');
    let letterSide = width/maxLen;
    let stack = document.getElementById(_stack);
    //letters.style.width  = letterSide * word.length + 'px';
    stack.innerHTML = '';
    let letter = null;
    for(let char of word)
        {
            letter = document.createElement('div');
            letter.className = _letter;
            letter.style.width =  letterSide +'px';
            letter.style.height = letterSide + 'px';
            letter.style.fontSize = letterSide +"px";
            letter.style.lineHeight = letterSide +"px";
            letter.innerText = char;
            stack.appendChild(letter);
        }
    
}

function mixWord(wordStr, spliter)
{
    let sortValues = [-1,1];
    let word = wordStr.split(spliter);
    let mixedWord = word.sort(()=>
        {
            let index = Math.round(Math.random() * (sortValues.length-1));
            return sortValues[index];
        });
        localStorage.setItem("mixedWord", mixedWord.join(spliter));
       return mixedWord.join(spliter);
}

function findRandomletter(word_par, mixedWord_par)
{
    let indexes = localStorage.getItem('index').split(',');
    let word = word_par;
    let mixedWord = mixedWord_par;

    let currentMixedWord = getHashedWord(mixedWord).join('');
    let currenttWord = getHashedWord(word).join('');;
    if(currentMixedWord==currenttWord)
    {
        newWord();
    }
    else if( indexes.length>1 )
        {
            let randomIndex = Math.round(Math.random()*(indexes.length-1));
            let selectedIndex = +indexes[+randomIndex];
            let letter = word[+selectedIndex];
            indexes.splice(+randomIndex,1);
            localStorage.setItem('index',indexes);

            let index = mixedWord.findIndex(ltr=>{return ltr===letter;});
            mixedWord[index] = mixedWord[selectedIndex];
            mixedWord[selectedIndex] = letter;
            let newMixedWordHash =  mixedWord.join(',');
            localStorage.setItem("mixedWordHash", newMixedWordHash);
            return mixedWord;
        }
   
}

function getHash(word)
{
    let hash = new Array(word.length);
    let strHash = _nill;
    for(let i=0; i<word.length; i++)
        {
            let hashStr = word.charCodeAt(i).toString(2);
            let hashStrAlgn = '';
            for(let j=0;j<_utf16Ln - hashStr.length;j++)
                {
                    hashStrAlgn+='0';
                }
                hashStr = hashStrAlgn + hashStr;

            let biasStr = i.toString(2);
            let biasStrAlgn = '';
            for(let k=0;k<_biasLn - biasStr.length;k++)
                {
                    biasStrAlgn+='0';
                }
                biasStr = biasStrAlgn + biasStr;

            strHash =  biasStr + hashStr;
            console.log(biasStr.length + " | " + hashStr.length);
            hash[i] = strHash;
        }
    return hash;
}

function getHashedWord(hash)
{
    let bitStr = null;
    let char = null;
    let code = null;
    let word = new Array();
    for(let bit of hash)
        {
            bitStr = bit.substring(_biasLn,bit.length);
            char = String.fromCharCode("0b" + bitStr);
            word.push(char);
        }

    return word;
}

function newWord(e)
{
    let minLen = localStorage.getItem('minLevelValue');
    let maxLen = localStorage.getItem('maxLevelValue');

    getWord(minLen,maxLen);
    if(e) e.stopPropagation(); 
}

function showLetter(e)
{
    let wordhash = localStorage.getItem('wordHash').split(',');
    let mixedWordHash = localStorage.getItem('mixedWordHash').split(',');

    findRandomletter(wordhash,mixedWordHash);
    
    let newMixedWordhash = localStorage.getItem('mixedWordHash').split(',');
    let newMixedWord = getHashedWord(newMixedWordhash);
    printWord(newMixedWord);
    if(e) e.stopPropagation();
}