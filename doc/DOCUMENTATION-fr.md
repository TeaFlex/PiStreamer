# Documentation (Français)

##   Table des matières
 - [PistreamServer](#pistreamserver---class)
 - [createServer()](#createserver---function)
 - [createClient()](#createclient---function)
 - [StreamOptions](#streamoptions---interface)
 -  [VideoOptions](#videooptions---interface)
 - [ImageEffects](#imageeffects---enum)

## PiStreamServer - [class]
### Champs
|Modificateur|  Nom | Type | Commentaire |
|--|--|--|--|
|static | log| winston.Logger | Logger static de PiStreamer. Vous pouvez le modifier en donnant un objet winston.Logger.
|private | buffer | Buffer | - |
|private | streamer?|child_process.ChildProcessWithoutNullStreams / null | - |
|private | readStream? | stream.Readable / null| - |
|private | wsServer | ws.Server | Instance de serveur WebSocket.|
|private |options|PiStreamer.StreamOptions|Options du stream, incluant les options vidéo ainsi que d'autres paramètres.|
|private readonly| defaultOptions| PiStreamer.StreamOptions| Valeurs par défaut du stream.|
### Fonctions
|Modificateur|  Nom | Paramètres | Valeur retournée | Commentaire |
|--|--|--|--|--|
|protected|stopFeed|-|void|Arrête le flux et tue le processus raspivid.|
|protected|startFeed|-|void|Initie le flux en créant un nouveau si il n'en existe pas ou en continuant celui qui est déjà présent.|
|protected|createFeed|-|void|Crée un nouveau flux en lançant un nouveau processus raspivid.|
|protected|boradcast|data: any|void|Diffuse le flux à tous les clients websocket connectés.|
|protected|newClient|socket: ws|void|Actions entreprises lors de la connection d'un nouveau client.|

### Méthodes
|Modificateur|  Nom | Paramètres | Valeur retournée |Commentaire |
|--|--|--|--|--|
|public|setOptions|options: PiStreamer.StreamOptions|void|Définit les options du stream.|

## createServer - [function]
Crée une nouvelle instance de PiStreamServer et retourne le serveur Http lié à ce dernier.
### Parameters
- requestListener : *http.RequestListener* - Request listener.
- video? : PiStreamer.StreamOptions - Options du stream.
### Return
- *http.Server*

## createClient - [function]
Copie le fichier client "http-live-player.js" dans le chemin donné.
### Parameters
- path : *string* - Chemin du dossier cible.
### Return
- *void*

## StreamOptions - [interface]
|Nom du champ| Type | Commentaire |
|--|--|--|
|videoOptions?|PiStreamer.VideoOptions|Options relative à la sortie vidéo.|
|dynamic?|boolean|Définit l'arrêt dynamique du stream. Si la valeur est vraie, le stream s'arrêtera s'il ne reste plus aucun spectateur.|
|limit?|int|Définit la limite de spectateur.|

## VideoOptions - [interface]
|Nom du champs| Type | Commentaire |
|--|--|--|
|height?|int|Hauteur de l'image.|
|width?|int|Largeur de l'image.|
|framerate?|int|Fréquence d'images de la vidéo.|
|hFlip?|boolean|Retourne horizontalement l'image si vrai.|
|vFlip?|boolean|Retourne verticalement l'image si vrai.|
|brightness?|int|Luminausité de la vidéo.|
|contrast?|int|Contraste de la vidéo.|
|sharpness?|int|Netteté de la vidéo.|
|saturation?|int|Saturation de la vidéo.|
|imxfx?|PiStreamer.ImageEffects|Effet appliqué à l'image.|

## ImageEffects - [enum]
Valeurs pouvant être utilisées pour appliquer un effet à l'image de la vidéo. Il se pourrait que quelques des effets ne fonctionnent pas, cela dépend entièrement de la version actuelle de raspivid.
### Values: 
-   none: pas d'effet (par défaut)
-   negative: inverse les couleurs de l'image
-   solarise: solarise l'image
-   posterise: postérise l'image
-   whiteboard: effet tableau blanc
-   blackboard: effet tableau noir
-   sketch: effet dessin
-   denoise: débruite l'image
-   emboss: gaufre l'image
-   oilpaint: effet peinture à l'huile
-   hatch: effet d'esquisse de hachures
-   gpen: effet d'esquisse graphite
-   pastel: effet pastel
-   watercolour: effet peinture à l'eau
-   film: effet film à grain
-   blur: floute l'image
-   saturation: sature les couleurs de l'image
-   colourswap: pas complètement implémentée
-   washedout: pas complètement implémentée
-   colourpoint: pas complètement implémentée
-   colourbalance: pas complètement implémentée
-   cartoon: pas complètement implémentée

Source: [Raspivid documentation](https://www.raspberrypi.org/documentation/raspbian/applications/camera.md).