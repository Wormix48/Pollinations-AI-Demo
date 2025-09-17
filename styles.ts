import type { Style } from './types';

const stylesRaw = `
Style name: 2D Game Art; 2D Game Art, often for platformers, pixel art, or side-scrolling games
Style name: 3D Animation; 3D Animation, often for computer-generated imagery, three-dimensional modeling, or virtual cinematography
Style name: Abstract Painting; Painting in abstract styles, often using non-representational shapes, colors, and forms
Style name: ads-advertising_Uncategorized; Professional, modern, product-focused, commercial, eye-catching, highly detailed
Style name: ads-automotive_Uncategorized; Sleek, dynamic, professional, commercial, vehicle-focused, high-resolution, highly detailed
Style name: ads-corporate_Uncategorized; Professional, clean, modern, sleek, minimalist, business-oriented, highly detailed
Style name: ads-fashion editorial_Fashion; High fashion, trendy, stylish, editorial, magazine style, professional, highly detailed
Style name: ads-food photography_Photography; Appetizing, professional, culinary, high-resolution, commercial, highly detailed
Style name: ads-luxury_Uncategorized; Elegant, sophisticated, high-end, luxurious, professional, highly detailed
Style name: ads-real estate_Photography; Professional, inviting, well-lit, high-resolution, property-focused, commercial, highly detailed
Style name: ads-retail_Uncategorized; Vibrant, enticing, commercial, product-focused, eye-catching, professional, highly detailed
Style name: Aerial Photography; Aerial Photography, often for bird's-eye views, drone shots, or elevated perspectives
Style name: African Beadwork; African Beadwork, often for decorative patterns, cultural expression, or colorful designs
Style name: Ai Weiwei_1; in Social activism, dissident art, sunflower seeds, dropping Han urn
Style name: Airbrushing; Using airbrushing for art, often for smooth gradients, spray effects, or automotive art
Style name: Album Cover Art; Album Cover Art, often for music albums, band branding, or iconic cover designs
Style name: American Traditional_Retro_Tattoo Art; Bold lines, nautical elements, retro flair, symbolic
Style name: Analytical Cubism; Analytical Cubism, often for geometric deconstruction, monochromatic palette, or fragmented forms
Style name: Andy Warhol; in Mass production aesthetic, pop culture silkscreens, consumerist commentary, obsession with celebrity
Style name: Animated Films; Animated Films, often for animated characters, creative visuals, or family-friendly entertainment
Style name: Animation; Creating art with Animation, often for moving images, storytelling, or dynamic visuals
Style name: Anish Kapoor; in Reflective voids, perceptual disorientation, sinuous forms, color psychology
Style name: Ankama_Animation; Vibrant colors, expansive storyworlds, stylized characters, flowing motion
Style name: Anselm Kiefer; in Brooding landscapes, epic scale, German myth, layered symbolic density
Style name: Architectural Design; often focusing on aesthetics, functionality, and sustainability
Style name: Architectural Photography; Architectural Photography, often for building captures, structural aesthetics, or design documentation
Style name: Argentinian Art; Argentinian traditions, often for tango, Xul Solar, or silverwork
Style name: Art Deco; Art Deco, often for geometric shapes, luxury, or 1920s elegance
Style name: Art Nouveau; Art Nouveau, often for organic forms, flowing lines, or turn-of-the-century aesthetics
Style name: artstyle-abstract expressionism_Uncategorized; energetic brushwork, bold colors, abstract forms, expressive, emotional
Style name: artstyle-abstract_Uncategorized; non-representational, colors and shapes, expression of feelings, imaginative, highly detailed
Style name: artstyle-art deco_Uncategorized; geometric shapes, bold colors, luxurious, elegant, decorative, symmetrical, ornate, detailed
Style name: artstyle-art nouveau_Nature; elegant, decorative, curvilinear forms, nature-inspired, ornate, detailed
Style name: artstyle-constructivist_Uncategorized; geometric shapes, bold colors, dynamic composition, propaganda art style
Style name: artstyle-cubist_Uncategorized; geometric shapes, abstract, innovative, revolutionary
Style name: artstyle-expressionist_Uncategorized; raw, emotional, dynamic, distortion for emotional effect, vibrant, use of unusual colors, detailed
Style name: artstyle-graffiti_Architecture_Graffiti; street art, vibrant, urban, detailed, tag, mural
Style name: artstyle-hyperrealism_Photography; extremely high-resolution details, photographic, realism pushed to extreme, fine texture, incredibly lifelike
Style name: artstyle-impressionist_Uncategorized; loose brushwork, vibrant color, light and shadow play, captures feeling over form
Style name: artstyle-pointillism_Uncategorized; composed entirely of small, distinct dots of color, vibrant, highly detailed
Style name: artstyle-pop art_Culture; bright colors, bold outlines, popular culture themes, ironic or kitsch
Style name: artstyle-psychedelic_Surrealism; vibrant colors, swirling patterns, abstract forms, surreal, trippy
Style name: artstyle-renaissance_Uncategorized; realistic, perspective, light and shadow, religious or mythological themes, highly detailed
Style name: artstyle-steampunk_Uncategorized; antique, mechanical, brass and copper tones, gears, intricate, detailed
Style name: artstyle-surrealist_Surrealism; dreamlike, mysterious, provocative, symbolic, intricate, detailed
Style name: artstyle-typography_Uncategorized; stylized, intricate, detailed, artistic, text-based
Style name: artstyle-watercolor_Uncategorized; vibrant, beautiful, painterly, detailed, textural, artistic
Style name: Assemblage Art; Assemblage Art, often for three-dimensional collages, recycled materials, or constructed forms
Style name: Augmented Reality (AR) Art; Augmented Reality (AR) Art, often for mixed reality, spatial computing, or digital enhancement
Style name: Australian Aboriginal Art; Australian Aboriginal Art, often for dot painting, storytelling, or cultural heritage
Style name: Avant-Garde Fashion; Avant-Garde Fashion, often for experimental design, unconventional aesthetics, or artistic innovation
Style name: Banksy_1; in Guerilla street art, ironic graffiti, political satire, anonymous persona
Style name: Barbara Kruger; in Agitprop text and image, media critique, ideological tension, graphic design
Style name: Baroque; Baroque, often for grandeur, opulence, or 17th-century artistry
Style name: Bas-Relief Sculpture_Sculpture; Low depth carving, stone texture, partially protruding carved shapes and figures
Style name: Basket Weaving; bamboo, or willow
Style name: Bauhaus; Bauhaus, often for functional design, geometric forms, or modernist principles
Style name: Bio Art; often exploring the intersection of art and science
Style name: Black and White Photography; Black and White Photography, often for monochrome tones, classic aesthetics, or visual contrast
Style name: Blacklight Poster_Uncategorized; Day-glo ink, hippie motifs, far out 60s art
Style name: Body Art; Creating art on the human body, often using makeup, tattoos, or temporary materials
Style name: Bohemian Fashion; Bohemian Fashion, often for free-spirited clothing, artistic expression, or unconventional lifestyles
Style name: Botanical Illustration; Creating art with Botanical Illustration, often for plants, scientific accuracy, or natural beauty
Style name: Boudoir Photography_Photography; Silks, elegant lingerie, seductive gaze, carefully posed
Style name: Brazilian Art; Brazilian traditions, often for carnival, contemporary art, or indigenous crafts
Style name: Brazilian Graffiti Art; Brazilian Graffiti Art, often for urban expression, street culture, or vibrant murals
Style name: Bridal Fashion; Bridal Fashion, often for wedding gowns, bridal accessories, or romantic styling
Style name: British Art; British traditions, often for Pre-Raphaelites, Turner, or street art
Style name: Bronze Sculpture; often through casting and patination
Style name: Bruce Nauman; in Disorienting corridors, menacing neon, sinister wordplay, psychological tension
Style name: Brutalism; Brutalism, often for raw concrete, bold forms, or architectural honesty
Style name: Cabinet of Curiosities_Occult; Collection of macabre oddities gathered for occult research
Style name: Cake Decorating; fondant, or other edible materials, often for artistic or themed designs
Style name: Candid Portrait Photography; Candid Portrait Photography, often for natural expressions, unposed moments, or spontaneous captures
Style name: Caravaggio; in Chiaroscuro contrasts, theatrical tenebrism, dramatic naturalism, religious themes
Style name: Caribbean Carnival Art; Caribbean Carnival Art, often for festive costumes, parade floats, or cultural celebrations
Style name: Caricature; Creating art with Caricature, often for exaggeration, humor, or satirical portraits
Style name: Carnival Freakshow_Retro; Gaffed spectacles, anatomical anomalies, grotesque performers, come one come all
Style name: carpint_Gothic; hypernet:Roxxi2:065> CGI anime punk goth girl,green hair,black clothing,HD,RAW,CLEAN,HYPER CLARITY,
Style name: Caspar David Friedrich; in Sublime landscapes, Gothic ruins, lone figures in contemplation, Northern Romanticism
Style name: Cecily Brown; in Luscious painterly fields, suggestive forms, libidinal energy, gestural freedom
Style name: Celtic Knotwork Art; Celtic Knotwork Art, often for interlaced patterns, Celtic culture, or medieval design
Style name: Celtic Mythology Art; Celtic mythology, often for knots, Druids, or magical landscapes
Style name: Cemetery Statue_Uncategorized; Cold lifeless stone, weeping frozen form, ominous outstretched wings, evoking uneasy dread
Style name: Central African Art; Central African traditions, often for ritual objects, dance costumes, or community art
Style name: Ceramic Art; Creating art using ceramics, often for pottery, sculptures, or decorative objects
Style name: Ceramic Design; Ceramic Design, often for ceramic art, pottery design, or clay works
Style name: Ceramic Sculpture; often through hand-building, coiling, or wheel-throwing
Style name: Chalk Art; Chalk Art, often for sidewalk drawings, temporary art, or public engagement
Style name: Charcoal Drawing; often on paper, known for deep blacks and expressive lines
Style name: Charles Ray; in Disquieting mannequins, voyeurism and innocence, hyperrealist discomfort, disturbing psychology
Style name: Children's Fashion; Children's Fashion, often for kid's clothing, playful designs, or youthful creativity
Style name: Children's Theater; Children's Theater, often for children's plays, family entertainment, or educational theater
Style name: Chilean Art; Chilean traditions, often for arpilleras, modern sculpture, or poetic influences
Style name: Chinese Art; Chinese traditions, often for ink painting, calligraphy, or porcelain
Style name: Chinese Ink Painting; often featuring landscapes or nature
Style name: Chinese Jade Carving; Chinese Jade Carving, often for jade sculptures, symbolic motifs, or Chinese craftsmanship
Style name: Chinese Paper Cutting; Chinese Paper Cutting, often for decorative motifs, cultural celebrations, or handcrafted designs
Style name: Chris Ofili; in Beaded figures, psychedelic colors, hip hop energy, transgressive joy
Style name: Cindy Sherman_1; in Chameleon personas, cinematic tableaus, cultural stereotypes, questioning identity
Style name: Cinematography; including camera work, lighting, and composition
Style name: Circus Arts; Circus Arts, often for circus acts, acrobatic performances, or circus entertainment
Style name: Classic Western; Classic Western, often for cowboy heroes, frontier landscapes, or Wild West adventures
Style name: Classical Art; Classical Art, often for classical sculptures, Greek myths, or classical harmony
Style name: Classical Realism; Classical Realism, often for traditional techniques, realistic portrayal, or idealized beauty
Style name: Claude Monet; in Luminous impressions, plein air landscapes, serial studies, atmospheric color
Style name: Collage Art; assembling different materials, often paper, photographs, or fabric, onto a surface
Style name: Collage; Creating art using collage, often assembling various materials or images into a composition
Style name: Colombian Art; Colombian traditions, often for Botero, emeralds, or pre-Columbian gold
Style name: Commercial Photography; Commercial Photography, often for advertising, product shots, or business imagery
Style name: Computer art; Code as creative material, programmed algorithms generating emergent artworks, computational processes manifesting unimagined permutations
Style name: Concept Art for Movies; Creating concept art for movies, often for character design, environments, or visual development
Style name: Concept Art for Video Games; Creating concept art for video games, often for characters, levels, or game mechanics
Style name: Conceptual Art; often over visual or material concerns
Style name: Concert Poster Design; Concert Poster Design, often for gig promotion, band events, or live music advertising
Style name: Constructivism Art; Constructivism, often for geometric abstraction, industrial materials, or Russian modernism
Style name: Creepy Children_Portraiture; Pale faces, dark eyes, haunting stare, seemingly harmless yet deeply unsettling
Style name: Creepy Porcelain Doll_Fashion_Portraiture; Pale face, cracked, intricately detailed dress, glassy dead-eyed stare
Style name: Crime Films; Crime Films, often for criminal activities, police investigations, or underworld intrigue
Style name: Critical Realism_Uncategorized; Incisive social analysis conveyed through dispassionate realist scrutiny, shining flashlight objectivity on unpleasant realities
Style name: Cuban Art; Cuban traditions, often for Afro-Cuban themes, poster art, or avant-garde movements
Style name: Cubism Art; Cubism, often for geometric shapes, abstract forms, or modernism
Style name: Cubism; Winston Churchill looking at iPhone
Style name: Cyberpunk Fantasy Art; Cyberpunk, often for dystopian future, hackers, or neon aesthetics
Style name: Dadaism; Dadaism, often for anti-art sentiment, absurdity, or anarchic creativity
Style name: Damien Hirst_1; in Conceptual spectacle, dead animals, medicine cabinets, diamond skull
Style name: Dan Flavin; in Radiant neon chambers, pure phenomenology, light over image
Style name: Dance Performance Art; Creating art through dance performances, often exploring movement, expression, or thematic concepts
Style name: Dark Fantasy Art; Dark Fantasy, often for horror, gothic themes, or grim landscapes
Style name: Die Brucke_Graffiti; Raw expressionism, graffiti-like colors, emotional intensity, rejection of conventions
Style name: Diego Velazquez; in Royal portraiture, loose brushwork, monumental compositions, Spanish Baroque
Style name: Dieselpunk_Retro; Retrofuturism, art deco, mechanized armor, gritty adventurer aesthetic
Style name: Digital Animation; Creating animations using digital software, often for films, games, or interactive media
Style name: Digital Art; Digital Art, often for computer-generated imagery, digital manipulation, or virtual creativity
Style name: Digital Illustration; often for books, magazines, advertising, or web design
Style name: Digital Painting; Creating paintings using digital tools and software, often mimicking traditional painting techniques
Style name: Digital Sculpture; Creating sculptures using digital modeling and 3D software, often for visualization or 3D printing
Style name: Diorama_Uncategorized; Imaginative lifelike 3D scenes in miniature, peaceful temples or violent battles enacted
Style name: Disney Animation_Animation; Bright colors, fluid motion, charming characters, wholesome storytelling, hand-drawn animation
Style name: Documentary Films; Documentary Films, often for real-life subjects, informative content, or journalistic storytelling
Style name: Documentary Photography; Photographing subjects to document events, stories, or social issues, often in a journalistic style
Style name: Drama Films; Drama Films, often for emotional performances, character development, or human experiences
Style name: Dutch Art; Dutch traditions, often for Rembrandt, Delftware, or Golden Age painting
Style name: Earth Art; Earth, often for landscapes, natural materials, or grounding visuals
Style name: East African Art; East African traditions, often for beadwork, carving, or painting
Style name: Eco Art; often using sustainable materials or raising ecological awareness
Style name: Eco-Art; Eco-Art, often for ecological concerns, sustainable practices, or nature-inspired creations
Style name: Ed Ruscha; in Deadpan text and images, cinematic highways, visual rhythm, conceptual one-liners
Style name: Edgar Degas; in Candid impressions, asymmetric framing, ballet rehearsals, scumbled pastels
Style name: Edvard Munch; in Psychological anxiety, dark symbolism, graphic outlines, exposed inner turmoil
Style name: Edward Hopper; in Melancholic Americana, dramatic lighting, isolated figures, psychological nuance
Style name: Egyptian Mythology Art; Egyptian mythology, often for pharaohs, hieroglyphs, or the afterlife
Style name: El Anatsui; in Recycled metals, shimmering tapestries, fragmented grids, post-consumer grandeur
Style name: Elegant_Erotic_Photography; elevates eroticism to aesthetic heights, every image a seducing sublime masterpiece
Style name: Embroidery; often with intricate patterns or images
Style name: enhance_Uncategorized; award-winning, professional, highly detailed
Style name: Environmental Art; often to raise awareness about environmental issues
Style name: Ephemeral Art; Creating art that is temporary or transient, often using materials that decay, change, or disappear over time
Style name: Etching; often using acid to etch lines on a metal plate
Style name: Experimental Art; often challenging traditional boundaries
Style name: Experimental Photography; Experimental Photography, often for innovative techniques, avant-garde ideas, or unorthodox approaches
Style name: Expressionism; Expressionism, often for distorted forms, dramatic emotions, or subjective perceptions
Style name: Expressionist painting; Subjective distortion in service of inner expression, using vivid color and energetic mark-making to convey angst and alienation of modern experience
Style name: Fairy Tale Art; Fairy Tales, often for whimsical characters, enchanted forests, or moral lessons
Style name: Fantasy; Fantasy, often for magical realms, fantastical creatures, or otherworldly writing
Style name: Fashion Illustration; Creating illustrations for fashion design, often showcasing clothing, accessories, and style concepts
Style name: Fashion Photography; often for advertising, magazines, or brand promotion
Style name: Fauvism; Fauvism, often for wild color, bold brushwork, or emotional intensity
Style name: Filipino Art; Filipino traditions, often for weaving, jeepney art, or colonial influences
Style name: Fine Art Photography; Fine Art Photography, often for creative expression, artistic vision, or gallery displays
Style name: Fine_Art_Black_and_White_Photography; conjures evocative monochromatic worlds, weaving visual magic in timeless tones
Style name: Folk Art Variant_Folk Art; Naive style, untrained artists, handmade, vernacular tradition, expressive character
Style name: Folk Art_Folk Art; Raw directness reflecting everyday life, unschooled traditionalism passed through community, urgency of unpretentious expression
Style name: Folk Music Art; Folk Music Art, often for folk singers, traditional themes, or grassroots music
Style name: Food Art; often for sculptural, decorative, or conceptual purposes
Style name: Food Photography; Food Photography, often for culinary presentations, delicious visuals, or gastronomic art
Style name: Francisco Goya; in Social satire, haunting Black Paintings, dramatic brushwork, unflinching realism
Style name: French Art; French traditions, often for Impressionism, fashion design, or Gothic architecture
Style name: French Impressionism; French Impressionism, often for light effects, plein air painting, or modern life scenes
Style name: Fresco Painting Technique; Creating paintings using a fresco technique, often for walls or ceilings with water-based pigments on wet plaster
Style name: Frida Kahlo; in Intense self-portraits, Mexican folk styles, symbolic imagery, raw perspective
Style name: Futurism; technology, and the future, often using dynamic lines and compositions
Style name: futuristic-biomechanical cyberpunk_Sci-Fi_Dystopia; cybernetics, human-machine fusion, dystopian, organic meets artificial, dark, intricate, highly detailed
Style name: futuristic-biomechanical_Sci-Fi; blend of organic and mechanical elements, futuristic, cybernetic, detailed, intricate
Style name: futuristic-cybernetic robot_Sci-Fi; android, AI, machine, metal, wires, tech, futuristic, highly detailed
Style name: futuristic-cybernetic_Sci-Fi; futuristic, technological, cybernetic enhancements, robotics, artificial intelligence themes
Style name: futuristic-cyberpunk cityscape_Sci-Fi_Architecture; neon lights, dark alleys, skyscrapers, futuristic, vibrant colors, high contrast, highly detailed
Style name: futuristic-futuristic_Sci-Fi; sleek, modern, ultramodern, high tech, detailed
Style name: futuristic-retro cyberpunk_Sci-Fi_Retro; 80's inspired, synthwave, neon, vibrant, detailed, retro futurism
Style name: futuristic-retro futurism_Sci-Fi_Retro; vintage sci-fi, 50s and 60s style, atomic age, vibrant, highly detailed
Style name: futuristic-sci-fi_Sci-Fi; futuristic, technological, alien worlds, space themes, advanced civilizations
Style name: futuristic-vaporwave_Sci-Fi_Retro; retro aesthetic, cyberpunk, vibrant, neon colors, vintage 80s and 90s style, highly detailed
Style name: Gabriel Orozco; in Poetic everyday, altered oranges, subtle interventions, conceptual surprises
Style name: Galactic_Sci-Fi; Vast colorful nebulae, stars and planets, sci-fi space themes, mystery
Style name: Game Design; Designing video games, often focusing on gameplay, graphics, story, and user experience
Style name: game-bubble bobble_Fantasy; 8-bit, cute, pixelated, fantasy, vibrant, reminiscent of Bubble Bobble game
Style name: game-cyberpunk game_Sci-Fi_Dystopia_Games_Digital Media; neon, dystopian, futuristic, digital, vibrant, detailed, high contrast, reminiscent of cyberpunk genre video games
Style name: game-fighting game_Games; dynamic, vibrant, action-packed, detailed character design, reminiscent of fighting video games
Style name: game-gta_Uncategorized; satirical, exaggerated, pop art style, vibrant colors, iconic characters, action-packed
Style name: game-mario_Fantasy_Comics; vibrant, cute, cartoony, fantasy, playful, reminiscent of Super Mario series
Style name: game-minecraft_Still Life; blocky, pixelated, vibrant colors, recognizable characters and objects, game assets
Style name: game-pokemon_Fantasy; vibrant, cute, anime, fantasy, reminiscent of Pokйmon series
Style name: game-retro arcade_Retro_Games; 8-bit, pixelated, vibrant, classic video game, old school gaming, reminiscent of 80s and 90s arcade games
Style name: game-retro game_Retro; 16-bit, vibrant colors, pixelated, nostalgic, charming, fun
Style name: game-rpg fantasy game_Fantasy_Games; detailed, vibrant, immersive, reminiscent of high fantasy RPG games
Style name: game-strategy game_Games; overhead view, detailed map, units, reminiscent of real-time strategy video games
Style name: game-streetfighter_Uncategorized; vibrant, dynamic, arcade, 2D fighting game, highly detailed, reminiscent of Street Fighter series
Style name: game-zelda_Fantasy; vibrant, fantasy, detailed, epic, heroic, reminiscent of The Legend of Zelda series
Style name: Generative Art; Creating generative art, often using algorithms, code, or automated processes to produce visual outcomes
Style name: Geometric abstract painting; Lines, circles, triangles, grids in dynamic tension, pure color, flatness
Style name: Geometric Abstraction; Geometric Abstraction, often for mathematical precision, geometric shapes, or formal composition
Style name: Georg Baselitz; in Inverted figures, roughhewn canvases, German angst, disrupting conventions
Style name: Georgia O'Keeffe; in Sensualized flowers, Southwest vistas, monumental canvas scale, abstracted natural forms
Style name: Gerhard Richter_1; in Photorealism, abstract smears, conceptual irony, blurred Candice
Style name: German Art; German traditions, often for Expressionism, Bauhaus, or medieval woodcuts
Style name: Ghibli_Surrealism; Dreamlike wonder, hand painted backgrounds, youthful characters, wholesome
Style name: Glamorous_Erotic_Photography; reclaims eroticism as a prismatic work of art
Style name: Glass Sculpture; often through glassblowing, casting, or fusing techniques
Style name: Glenn Ligon; in Appropriated text, fractured meanings, racial identity, unsettled language
Style name: Glitch Art_Uncategorized; Data corruption, pixel sorting, compression artifacts, VHS distortion, cyberpunk, vaporwave
Style name: Graffiti Art; often on walls, trains, or urban surfaces
Style name: Graffiti Style_Graffiti; Vibrant spray paint art, dripping colors, bubble letters
Style name: Grant Wood; in Regionalist depictions, folksy charm, idealized rural life, bold posturing
Style name: greatz_Portraiture; hypernet:KKFFKK:1> 80s anime screencap, Highly detailed ultraHD 4k HD keyframe  of 1boy, Anime Sean, Long_Red_beard, Red_hair, red_facial_hair, long_hair, wearing_all_black, green_background, simple_background, solo, upper_body, suit, Intricately_detailed_eyes, intricate_face,  
Style name: Greek Art; Greek traditions, often for classical sculpture, pottery, or Byzantine mosaics
Style name: Greek Classical Sculpture; Greek Classical Sculpture, often for idealized forms, anatomical accuracy, or ancient aesthetics
Style name: Greek Mythology Art; Greek mythology, often for gods, heroes, or epic tales
Style name: Greek Pottery Art; Greek Pottery Art, often for ancient pottery, mythological scenes, or classical forms
Style name: Gritty_Voyeuristic_Photography; peels back society's mask, revealing the raw and riveting truths beneath
Style name: gsssggg_Portraiture; Highly detailed ultraHD 4k HD keyframe  of 1girl,Red_hair,long_hair,simple_background,solo,upper_body,Intricately_detailed_eyes,intricate_face,bright sunny day,(80s anime screencap:13),voluptuous,directed by Tomomi Mochizuki,directed by Tsutomu Shibayama,art by Rumiko Takahashi,
Style name: Gustav Klimt; in Decadent patterning, eroticized figures, gold leaf, mandala-like designs
Style name: Gutai_Sci-Fi_Event; Radical experimentalism using real spaces and time, spontaneous event and performance, forerunner to fluxus and happenings
Style name: HP Lovecraft Cover_Horror; P Lovecraft book cover Winston Churchill looking at iPhone Unnamable ancient one, incomprehensible sanity-blasting geometries, cosmic horror
Style name: Hallstatt; Hallstatt, often for Alpine scenery, salt mines, or Austrian tradition
Style name: Haunted Portrait_Portraiture_Horror; Ghoulish subject staring back, ghostly aura, unsettling mix of lifelike and spectral
Style name: Haute Couture; Haute Couture, often for exclusive fashion, custom-fitted garments, or high-end design
Style name: Hawkins; Hawkins, often for supernatural events, Eleven, or Stranger Things setting
Style name: Henri Matisse; in Vibrant fauvism, flattened patterning, curvilinear lines, expressive distortion
Style name: Hieronymus Bosch; in Apocalyptic visions, grotesque creatures, detailed fantastical landscapes, moral allegories
Style name: High Fantasy Art; High Fantasy, often for epic quests, magical realms, or heroic adventures
Style name: Hip-Hop Album Art; Hip-Hop Album Art, often for urban aesthetics, graffiti elements, or hip-hop culture
Style name: Hogwarts; Hogwarts, often for magic, wizards, or Harry Potter universe
Style name: hoop_Portraiture; face turned to the side,coat hanging over arms,anime girl chest and waist,Anime screen cap,perfect CGI render,clean edges,Unreal Engine 5,hyper detailed side of face,
Style name: Horror; Horror, often for horror elements, terrifying scenes, or creepy writing
Style name: Hyperrealism_Uncategorized; Visual clarity magnified beyond human eye's abilities, hallucinatory detail exceeding real perceptive capacities
Style name: Ice Sculpture; Ice Sculpture, often for frozen art, ice carving, or cold beauty
Style name: Illustration for Children's Books; Creating illustrations for children's books, often colorful and imaginative to engage young readers
Style name: Impressionism Art; Impressionism, often for light, color, or fleeting moments
Style name: Impressionism; Impressionism, often for light-filled scenes, loose brushwork, or fleeting moments
Style name: Inca Mythology Art; Inca mythology, often for Machu Picchu, quipus, or sun worship
Style name: Indian Art; Indian traditions, often for miniatures, textile arts, or Hindu iconography
Style name: Indian Mythology Art; Indian mythology, often for deities, epics, or spiritual allegories
Style name: Indonesian Art; Indonesian traditions, often for batik, puppetry, or tribal arts
Style name: Ink Drawing; often on paper, known for bold lines and graphic effects
Style name: Insectoid Mutant_Portraiture; Multifaceted eyes, proboscis mouth, undersized exposed heart, writhing in agony
Style name: Installation Art; often using mixed media and immersive techniques
Style name: Interactive Art; often using technology, sensors, or audience participation
Style name: Irish Art; Irish traditions, often for Celtic designs, Book of Kells, or contemporary crafts
Style name: Islamic Art; often using geometric patterns, calligraphy, and ornamental design
Style name: Italian Art; Italian traditions, often for Renaissance masters, frescoes, or Venetian glass
Style name: Italian Renaissance Art; Italian Renaissance Art, often for humanism, classical beauty, or technical mastery
Style name: JMW Turner; in Atmospheric light effects, turbulent seascapes, dynamic vortex compositions, vaporous clouds
Style name: Jackson Pollock; in Gestural energy, spattered drips, unstructured canvases, dynamic all-over composition
Style name: Japanese Art; Japanese traditions, often for ukiyo-e, origami, or Zen aesthetics
Style name: Japanese Mythology Art; Japanese mythology, often for kami, folklore, or Shinto rituals
Style name: Jazz Poster Art; Jazz Poster Art, often for jazz musicians, swing era, or jazz club aesthetics
Style name: Jeff Koons; in Banal readymades, inflated kitsch, cleaners in vitrines, overblown excess
Style name: Jenny Holzer; in Words as art, truisms and laments, electronic signs, institutional critique
Style name: Johannes Vermeer; in Contemplative interiors, soft luminous light, rich color harmonies, serene mood
Style name: John Baldessari; in Text wry puns, covering faces, doubting images, semiotic play
Style name: Joyful Art; Joy, often for happiness, bright colors, or uplifting imagery
Style name: Julie Mehretu; in Tectonic abstractions, architectural fragments, layered histories, geopolitical textures
Style name: Kabuki Theater; Kabuki Theater, often for kabuki plays, Japanese theater, or kabuki makeup
Style name: Kara Walker; in Racial silhouettes, cut paper, violent histories, shadow archetypes
Style name: Katsushika Hokusai; in Ukiyo-e woodblock prints, iconic Great Wave, dynamic compositions, naturalistic landscapes
Style name: Kawaii Character_Uncategorized; Large eyes, lively colors, energetic, Japanese style
Style name: Kehinde Wiley; in Contemporary people of color, old master poses, street culture meets history painting, subverting traditions
Style name: Kerry James Marshall; in Black figures celebrated, flat shapes and patterns, affirmative visions, reclaiming representation
Style name: Kiki Smith; in Feminine archetypes, mystical allegories, traumatic memories, material metamorphosis
Style name: Kinetic Art; Kinetic Art, often for moving parts, mechanical motion, or dynamic sculptures
Style name: Kinetic Sculpture; often using wind, motors, or viewer interaction
Style name: Kintsugi (Japanese Gold Repair); Kintsugi, often for golden repair of pottery, embracing imperfections, or aesthetic philosophy
Style name: Kitsch Movement_Uncategorized; Exaltation of tacky mass-produced ornament, garish colors and exaggerated gesture, vulgarly displaying bad taste
Style name: Knitting; often using needles, to create fabric for clothing or decorative items
Style name: kool_Portraiture; Tentacle hentai sex,art by Yoshihiro Togashi,Madhouse studios production,perfect CGI render,Unreal Engine 5,Anime screen cap,clean edges,80s anime screencap,Highly detailed ultraHD 4k HD keyframe  of 1boy,Red_hair,long_hair,simple_background,solo,head and face,Intricately_detailed_eyes,intricate_face,<hypernet:80s Anime:075>,clean lines,blu-ray remaster,
Style name: Korean Art; Korean traditions, often for celadon pottery, folk painting, or Buddhist art
Style name: Korean Celadon Ceramics; Korean Celadon Ceramics, often for jade-green glazes, elegant forms, or traditional pottery
Style name: LAIKA_Animation; Intricate puppet models, replacement animation, tactile textures, emotional storytelling
Style name: Landscape Photography; including natural scenery, urban environments, and seascapes
Style name: Leonardo da Vinci; in Intellectual brilliance, anatomical precision, sfumato technique, innovative inventions
Style name: Lettrist artwork; Avant-garde letters freed into pure form, visual rhythm and texture of typography as sole communication
Style name: Light Art; Light Art, often for illumination, light sculptures, or visual effects
Style name: Lithography; often drawing on a stone or metal plate
Style name: Lovecraftian Horror_Horror; Unknowable tentacles, cosmic otherworldly menace, maddening for mortal minds to behold
Style name: Luxury Fashion; Luxury Fashion, often for designer brands, high-quality materials, or exclusive luxury
Style name: Macabre Memento Mori_Horror_Horror & Dark_Still Life; Wiltedbouquet, skull, burnt-out candle, uncanny shadows, made grim by presence of death
Style name: Machinima Variant_Uncategorized; Cinematic narratives constructed in real-time 3D game engines, liberating filmmaking from institutional barriers
Style name: Macro Photography; Macro Photography, often for close-up views, small subjects, or detailed examination
Style name: Madhubani Painting; Madhubani Painting, often for folk art, colorful patterns, or Bihar culture
Style name: Magic Realist painting; Matter-of-fact presentation of the fantastical, seamless merging of material reality and flights of fancy, precision of illusion
Style name: Mall Goth_Portraiture_Gothic; Dark academia outfits, smoky eyeshadow, melancholy gaze
Style name: Mannerism; Mannerism, often for elongated figures, artificial poses, or mannerist painting
Style name: Maori Wood Carving; Maori Wood Carving, often for carved patterns, Maori culture, or New Zealand artistry
Style name: Marina Abramovic; in Confronting endurance, communal ritual, metabolizing trauma, dematerializing art
Style name: Mark Bradford; in Dense abstract grids, merchant posters, layers of sanded paper, mapping marginalization
Style name: Mark Grotjahn; in Colorful stripes and bands, radiating lines, optical vibration, regulating chaos
Style name: Martin Puryear; in Handcrafted wood, organic abstraction, whooshing forms, vernacular roots
Style name: Maurizio Cattelan; in Disruptive scenarios, wry subversion, provocative spectacles, offending the establishment
Style name: Maximalism; Maximalism, often for excess, elaborate details, or over-the-top aesthetics
Style name: Media Art; technology, and interactive elements into art, often for immersive experiences
Style name: Medical Oddities_Uncategorized; Plague Mass Grave
Style name: Melancholy Art; Melancholy, often for sadness, blue tones, or reflective moods
Style name: Memento Mori_Horror_Horror & Dark; Decomposing severed heads in various states of decay and anguish mounted on spikes
Style name: Mesoamerican Mythology Art; Mesoamerican mythology, often for Aztec, Maya, or ancient civilizations
Style name: Mesopotamian Mythology Art; Mesopotamian mythology, often for Gilgamesh, ziggurats, or ancient rites
Style name: Metal Music Artwork; Metal Music Artwork, often for metal bands, dark imagery, or heavy metal visuals
Style name: Metalwork; Creating art with Metalwork, often for forging, welding, or industrial crafts
Style name: Mexican Art; Mexican traditions, often for muralism, Day of the Dead, or folk art
Style name: Mexican Muralism; Mexican Muralism, often for social messages, public art, or national identity
Style name: Mexican Skull Art_Uncategorized; Colorful skulls, marigold flowers, traditional decorations
Style name: Michelangelo; in Sculptural mastery, powerfully muscular forms, vast fresco cycles, master draftsmanship
Style name: Minimalism; An art movement focusing on simplicity and reduction, often using geometric shapes and monochrome palettes
Style name: misc-disco_Retro; vibrant, groovy, retro 70s style, shiny disco balls, neon lights, dance floor, highly detailed
Style name: misc-dreamscape_Fantasy_Surrealism; surreal, ethereal, dreamy, mysterious, fantasy, highly detailed
Style name: misc-dystopian_Dystopia; bleak, post-apocalyptic, somber, dramatic, highly detailed
Style name: misc-fairy tale_Fantasy; magical, fantastical, enchanting, storybook style, highly detailed
Style name: misc-gothic_Gothic; dark, mysterious, haunting, dramatic, ornate, detailed
Style name: misc-grunge_Retro; textured, distressed, vintage, edgy, punk rock vibe, dirty, noisy
Style name: misc-horror_Horror; eerie, unsettling, dark, spooky, suspenseful, grim, highly detailed
Style name: misc-horror_Horror_Horror & Dark; eerie, unsettling, dark, spooky, suspenseful, grim, highly detailed
Style name: misc-kawaii_Uncategorized; cute, adorable, brightly colored, cheerful, anime influence, highly detailed
Style name: misc-lovecraftian_Surrealism_Horror; eldritch, cosmic horror, unknown, mysterious, surreal, highly detailed
Style name: misc-macabre_Gothic; dark, gothic, grim, haunting, highly detailed
Style name: misc-manga_Uncategorized; vibrant, high-energy, detailed, iconic, Japanese comic style
Style name: misc-metropolis_Sci-Fi_Architecture; urban, cityscape, skyscrapers, modern, futuristic, highly detailed
Style name: misc-minimalist_Uncategorized; simple, clean, uncluttered, modern, elegant
Style name: misc-monochrome_Uncategorized; black and white, contrast, tone, texture, detailed
Style name: misc-nautical_Uncategorized; sea, ocean, ships, maritime, beach, marine life, highly detailed
Style name: misc-space_Sci-Fi; cosmic, celestial, stars, galaxies, nebulas, planets, science fiction, highly detailed
Style name: misc-stained glass_Uncategorized; vibrant, beautiful, translucent, intricate, detailed
Style name: misc-tribal_Uncategorized; indigenous, ethnic, traditional patterns, bold, natural colors, highly detailed
Style name: misc-zentangle_Uncategorized; intricate, abstract, monochrome, patterns, meditative, highly detailed
Style name: Mixed Media Art; often combining painting, collage, and sculpture
Style name: Mixer_Animation; Energetic motion, stylized characters, lush painterly backgrounds
Style name: mkkk_Portraiture_Digital Media_Animation; high_quality_digital_artwork_of,CUTE_ANIME_GIRL,facemask,brightly_colored_hair,Madhouse_productions,(KyoAni:13),Kyoto_Animations,Key_Frame,Key-frame,Key_frame,KEYFRAME,(anime-style_eyes:0001),anime_hairstyle,anime_character_design,soft_features,vibrant_anime_colors,attention_to_detail,artistic_flair,
Style name: Mona Hatoum; in Unsettling domesticity, kitchen utensils, menacing familiarity, charged minimalism
Style name: Monoprinting Technique; Creating prints using a monoprinting technique, often for one-of-a-kind images with painterly qualities
Style name: Mosaic; Creating art with Mosaic, often for tesserae, patterns, or decorative surfaces
Style name: Movie Storyboard_Uncategorized; Panel frames, thumbnail sketches, dramatic angles, notes, direction
Style name: Mughal Miniature Painting; Mughal Miniature Painting, often for detailed illustrations, royal themes, or Indian heritage
Style name: Mythic Fantasy Art; Mythic Fantasy, often for legendary creatures, ancient gods, or mystical landscapes
Style name: Native American Art; often using traditional materials, symbols, and techniques
Style name: Native American Basketry; Native American Basketry, often for woven baskets, natural fibers, or tribal patterns
Style name: Native American Mythology Art; Native American mythology, often for totems, spirits, or tribal heritage
Style name: Native American Pottery; Native American Pottery, often for earthenware, hand-built techniques, or indigenous designs
Style name: Nautical_Retro; Rope, ships at sea, maritime map, navigation tools, 19th century
Style name: Neo Rauch; in Surreal juxtapositions, enigmatic narratives, European allegories, psychological tension
Style name: Neo-Dada_Uncategorized; Modern resurrection of absurdism and anarchy, derailing rational thought through chance procedures, irrational juxtapositions, deliberately ridiculous
Style name: Neo-Expressionism_Uncategorized; Spontaneous process over premeditation, raw primal gestural brushwork, intense colors, mythic archetypes, reborn painting connects to authentic human experience
Style name: Neo-Gothic Architecture; Neo-Gothic Architecture, often for 19th-century revival, historical details, or Victorian design
Style name: Neo-Noir; Neo-Noir, often for modern noir elements, psychological twists, or contemporary thrillers
Style name: Neo-Pop (1)_Pop Culture_Culture; Exuberant remixing of commercial pop culture, hyper-reality of simulation, saturated colors, larger than life appropriated imagery
Style name: Neo-primitivism (1)_Still Life; Masks, artifacts, ceremonial objects, references to ancestral magic and myths, abandoning Western rationalism
Style name: Neoclassicism; Neoclassicism, often for classical themes, idealized beauty, or 18th-century revival
Style name: Neon Lighting_Uncategorized; Glowing neon tubes, bright luminous colors, intricate bent shapes, vibrant pink and blue tones
Style name: Neoplasticism; Neoplasticism, often for geometric abstraction, primary colors, or neoplastic harmony
Style name: New Perpendicular art_Uncategorized; Jagged lines, bright colors, erratic brush, postmodernist combines early modern art styles
Style name: Nicole Eisenman; in Raw compositions, somatic forms, carnivalesque environments, existential bathers
Style name: Night Photography; Night Photography, often for low-light captures, star trails, or nocturnal landscapes
Style name: Nordic Viking Art; Nordic Viking Art, often for historical motifs, runic inscriptions, or warrior culture
Style name: Norse Mythology Art; Norse mythology, often for Vikings, runes, or Valhalla
Style name: North African Art; North African traditions, often for Islamic patterns, ceramics, or metalwork
Style name: Nouveau Circus_Uncategorized; Stylized performers, abstract figures, colorful tents
Style name: Oil Painting; often on canvas, known for rich colors and flexible texture
Style name: Olafur Eliasson; in Phenomena manipulation, immersive environments, perceptual engagement, collaborative practice
Style name: Op Art; Op Art, often for optical illusions, perceptual effects, or visual vibrations
Style name: Op Art_Uncategorized; Optical vibrating effects, disorienting movement illusion, flashing pulses, dazzling viewers
Style name: Opera Music Illustration; Opera Music Illustration, often for opera singers, theatrical scenes, or classical elegance
Style name: Outsider Art_Uncategorized; Unfiltered personal vision, marginalized artists outside the mainstream, mediums chosen for expressiveness not formal qualities
Style name: Pablo Picasso; in Pioneering Cubism, fractured planes, collage innovations, timeless originality
Style name: Pandora; Pandora, often for bioluminescent plants, Na'vi, or Avatar universe
Style name: Paper Cutting; Creating art with Paper Cutting, often for silhouettes, delicate patterns, or hand-cut designs
Style name: Paper Mache Art; often in sculptures, masks, or decorative items
Style name: papercraft-collage_Uncategorized; mixed media, layered, textural, detailed, artistic
Style name: papercraft-flat papercut_Uncategorized; silhouette, clean cuts, paper, sharp edges, minimalist, color block
Style name: papercraft-kirigami_Uncategorized; 3D, paper folding, paper cutting, Japanese, intricate, symmetrical, precision, clean lines
Style name: papercraft-paper mache_Uncategorized; 3D, sculptural, textured, handmade, vibrant, fun
Style name: papercraft-paper quilling_Uncategorized; intricate, delicate, curling, rolling, shaping, coiling, loops, 3D, dimensional, ornamental
Style name: papercraft-papercut collage_Uncategorized; mixed media, textured paper, overlapping, asymmetrical, abstract, vibrant
Style name: papercraft-papercut shadow box_Uncategorized; layered, dimensional, depth, silhouette, shadow, papercut, handmade, high contrast
Style name: papercraft-stacked papercut_Uncategorized; 3D, layered, dimensional, depth, precision cut, stacked layers, papercut, high contrast
Style name: papercraft-thick layered papercut_Uncategorized; deep 3D, volumetric, dimensional, depth, thick paper, high stack, heavy texture, tangible layers
Style name: Parametric Architecture; Parametric Architecture, often for computational design, algorithmic forms, or digital fabrication
Style name: Participatory Art; Creating art through participatory methods, often involving audiences, communities, or interactive elements
Style name: Paul Cezanne; in Geometric reduction, architectonic composition, boldly constructive brushwork, bathers series
Style name: Performance Art; movements, sounds, or spoken words, often in a live setting
Style name: Performance Sculpture; often using movement, sound, or interaction
Style name: Peruvian Art; Peruvian traditions, often for Inca heritage, textiles, or Cusco School painting
Style name: Petra; Petra, often for rock-cut architecture, archaeological wonders, or Jordanian culture
Style name: photo-alien_Sci-Fi_Photography; extraterrestrial, cosmic, otherworldly, mysterious, sci-fi, highly detailed
Style name: photo-film noir_Photography; monochrome, high contrast, dramatic shadows, 1940s style, mysterious, cinematic
Style name: photo-hdr_Photography; High dynamic range, vivid, rich details, clear shadows and highlights, realistic, intense, enhanced contrast, highly detailed
Style name: photo-long exposure_Photography_Surrealism; Blurred motion, streaks of light, surreal, dreamy, ghosting effect, highly detailed
Style name: photo-neon noir_Photography; cyberpunk, dark, rainy streets, neon signs, high contrast, low light, vibrant, highly detailed
Style name: photo-silhouette_Photography; high contrast, minimalistic, black and white, stark, dramatic
Style name: photo-tilt-shift_Photography; Selective focus, miniature effect, blurred background, highly detailed, vibrant, perspective control
Style name: Photography; Creating art with Photography, often for capturing reality, light, or visual narratives
Style name: Photojournalism; Photojournalism, often for news reporting, current events, or visual storytelling
Style name: Photorealism; Photorealism, often for highly detailed representation, photographic accuracy, or visual illusion
Style name: Photorealistic painting; Virtuosic rendering elevates technical skill in service of duplicating photography's visual facts through painterly verisimilitude
Style name: Pinup_Retro; Retro swimsuits, playful poses, vibrant backdrop, kitschy Americana
Style name: Pixel Art; often in a retro or 8-bit style, used in games and digital media
Style name: Plein Air Painting; Plein Air Painting, often for outdoor painting, natural light, or landscape subjects
Style name: Plotter Art Variant_Uncategorized; Ink illustrations precisely executed by drawing machine, drafting aesthetics, tangible media
Style name: Plotter Art_Uncategorized; Ink illustrations precisely executed by drawing machine, drafting aesthetic, programmable art with tangible materiality
Style name: Pointillism Art; Pointillism, often for dots, optical blending, or Seurat's technique
Style name: Pointillism; Creating art using pointillism, often applying small dots of color to form an image
Style name: Polynesian Mythology Art; Polynesian mythology, often for Moai, navigation, or island legends
Style name: Polynesian Tattoo Art; Polynesian Tattoo Art, often for tribal tattoos, cultural symbols, or body adornment
Style name: Pop art style; Bold bright colors, ben-day dots, high contrast, Roy Lichtenstein, Andy Warhol
Style name: Pop Art; An art movement using popular culture imagery, often with bold colors and graphic styles
Style name: Porcelain Art; often in decorative objects, vessels, or fine tableware
Style name: Portrait Photography; focusing on expressions, personalities, and moods
Style name: Portuguese Art; Portuguese traditions, often for azulejos, cork crafts, or Manueline architecture
Style name: Post-Impressionism; Post-Impressionism, often for expressive color, symbolic content, or personal vision
Style name: Pottery; often shaped on a potter's wheel and fired in a kiln
Style name: Printmaking; Creating art with Printmaking, often for ink, presses, or editioned artworks
Style name: Prismatic_Uncategorized; Fragmented, kaleidoscopic, geometric, prism-like, refracting, rainbow, color palette, shattered
Style name: Projection Mapping Art; Creating art using projection mapping, often for large-scale visuals, events, or installations
Style name: Propaganda Art_Retro; Patriotic imagery, bold graphics, dramatic text, vivid colors
Style name: Propaganda Poster_Uncategorized; Eye-catching layout, symbolic imagery, bold text, dramatic patriotic message
Style name: Provocative_Surreal_Photography; Daring, dramatic dreamscapes that lure viewers into an alluring alternate reality, one laced with forbidden fruit ripe for the picking
Style name: Pseudorealism_Uncategorized; Illusion of impossible clarity and tangibility, 3D rendering of imagined perfection, realer than real, supernatural focus
Style name: Psychedelic Concert Posters; Psychedelic Concert Posters, often for trippy visuals, 1960s influence, or psychedelic rock concerts
Style name: Psychedelic Pop Art_Surrealism; Vibrant patterns, surreal figures, psychedelic 60s motifs
Style name: Public Art Installations; often engaging with community or social themes
Style name: Public Sculptures; Creating sculptures for public spaces, often enhancing urban landscapes, parks, or civic areas
Style name: Punk Fashion; Punk Fashion, often for rebellious attitudes, edgy clothing, or subcultural identity
Style name: Puppetry; Puppetry, often for puppet shows, marionettes, or puppeteers
Style name: Quilting Art; Quilting Art, often for fabric patterns, textile designs, or hand-stitched craftsmanship
Style name: Quilting; often with decorative stitching or patterns
Style name: Rachel Whiteread; in Ghostly casts, negative space solidified, homes and stairs, absence made present
Style name: Radical Realism (1)_Still Life; Ordinary subjects elevated through supernatural lighting effects, tableaus from unfamiliar angles, everyday epiphanies
Style name: Rangoli (Indian Floor Art); Rangoli, often for decorative floor designs, festive occasions, or cultural traditions
Style name: Raphael; in Harmonious compositions, idealized beauty, graceful Madonnas, dynamic movement
Style name: Rashid Johnson; in Black ritual residue, plants in shea butter, branded skin, cultural hybridity
Style name: Realism Art; Realism, often for true-to-life depiction, careful observation, or everyday subjects
Style name: Recycled Art; Creating art using recycled materials, often focusing on sustainability, creativity, or environmental messages
Style name: Rembrandt; in Emotive realism, radiant light effects, penetrating psychological insights, exquisite detail
Style name: Remodernism Variant_Uncategorized; Expressive color, distortion, mythic meaning, spirituality, seeks profound cultural renewal
Style name: Renaissance Art; Renaissance, often for classical beauty, humanism, or masterpieces
Style name: Renaissance; Renaissance, often for humanism, classical revival, or 15th-century art
Style name: Rene Magritte; in Surreal juxtapositions, deadpan perspective, bowler-hatted men, apples obscuring faces
Style name: Richard Serra; in Hulking Cor-Ten walls, visceral interior spaces, disorienting paths, viewers implicated
Style name: Richard Tuttle; in Humble poetic objects, intimate constructs, wire and cloth, ephemeral presence
Style name: Robert Gober; in Disquieting Americana, sinks and legs, Freudian unease, fragmented bodies
Style name: Robotics Art; often for kinetic sculptures, interactive installations, or performances
Style name: Rock Album Art; Rock Album Art, often for rock bands, rebellious imagery, or classic rock themes
Style name: Rococo Art; Rococo Art, often for rococo fashion, playful themes, or rococo interiors
Style name: Rococo; Rococo, often for ornate details, playful themes, or 18th-century elegance
Style name: Roman Mosaic Art; Roman Mosaic Art, often for tesserae mosaics, historical motifs, or decorative floors
Style name: Roman Mythology Art; Roman mythology, often for emperors, gladiators, or classical virtues
Style name: Romance; Romance, often for romantic relationships, love stories, or sentimental writing
Style name: Romanticism Art; Romanticism, often for emotion, nature, or individual expression
Style name: Romanticism; Romanticism, often for emotional expression, nature scenes, or romantic ideals
Style name: Rural Photography; Rural Photography, often for countryside, rural life, or agricultural scenes
Style name: Russian Art; Russian traditions, often for icons, Fabergй eggs, or Soviet posters
Style name: Russian Icon Painting; Russian Icon Painting, often for religious imagery, sacred traditions, or spiritual devotion
Style name: sai-3d-model_Uncategorized; octane render, highly detailed, volumetric, dramatic lighting
Style name: sai-analog film_Retro_Photography; faded film, desaturated, 35mm photo, grainy, vignette, vintage, Kodachrome, Lomography, stained, highly detailed, found footage
Style name: sai-anime_Uncategorized; anime style, key visual, vibrant, studio anime,  highly detailed
Style name: sai-cinematic_Uncategorized; shallow depth of field, vignette, highly detailed, high budget, bokeh, cinemascope, moody, epic, gorgeous, film grain, grainy
Style name: sai-comic book_Uncategorized; graphic illustration, comic art, graphic novel art, vibrant, highly detailed
Style name: sai-craft clay_Sculpture; sculpture, clay art, centered composition, Claymation
Style name: sai-digital art_Digital Media; digital artwork, illustrative, painterly, matte painting, highly detailed
Style name: sai-fantasy art_Fantasy_Surrealism; magnificent, celestial, ethereal, painterly, epic, majestic, magical, fantasy art, cover art, dreamy
Style name: sai-isometric_Uncategorized; vibrant, beautiful, crisp, detailed, ultra detailed, intricate
Style name: sai-line art_Uncategorized; professional, sleek, modern, minimalist, graphic, line art, vector graphics
Style name: sai-lowpoly_Uncategorized; low-poly game art, polygon mesh, jagged, blocky, wireframe edges, centered composition
Style name: sai-neonpunk_Uncategorized; cyberpunk, vaporwave, neon, vibes, vibrant, stunningly beautiful, crisp, detailed, sleek, ultramodern, magenta highlights, dark purple shadows, high contrast, cinematic, ultra detailed, intricate, professional
Style name: sai-origami_Uncategorized; paper art, pleated paper, folded, origami art, pleats, cut and fold, centered composition
Style name: sai-photographic_Photography; 35mm photograph, film, bokeh, professional, 4k, highly detailed
Style name: sai-pixel art_Uncategorized; low-res, blocky, pixel art style, 8-bit graphics
Style name: sai-texture_Uncategorized; top down close-up
Style name: Salvador Dali; in Hallucinatory surrealism, meticulous illusion, sexualized anxiety, Freudian symbolism
Style name: Sand Sculpture; Sand Sculpture, often for beach art, sand carving, or temporary installations
Style name: Sandro Botticelli; in Elegant contour, religious mythologies, supple grace, italicized line
Style name: Sarah Sze; in Fragile constellations, everyday ephemera, splintered narratives, precarious balance
Style name: Satire; Satire, often for satirical humor, social criticism, or witty writing
Style name: Scandinavian Art; Scandinavian traditions, often for minimalism, Viking art, or modern design
Style name: Science Fiction; Science Fiction, often for futuristic settings, advanced technology, or speculative fiction
Style name: Scientific Illustration_Retro; Botanical, anatomical, black and white, detailed engraving, hand-drawn, vintage, specimen
Style name: Screen Printing; often for posters, clothing, or graphic designs
Style name: Sculpture; Creating art with Sculpture, often for three dimensions, carving, or tactile forms
Style name: Shepard Fairey; in OBEY posters, provocative icons, appropriated images, viral graphics
Style name: Shirakawa-go; Shirakawa-go, often for thatched-roof houses, rural landscapes, or Japanese village life
Style name: Shirin Neshat; in Persian calligraphy, chadors and guns, gender divided, poetic cruelty
Style name: Sideshow Poster_Retro; Retro fonts, snake charmer, illustrated crowds, bright colors
Style name: Silent Films; Silent Films, often for silent era, visual storytelling, or early cinema classics
Style name: Skateboarding Fashion; Skateboarding Fashion, often for skate culture, functional clothing, or action sports style
Style name: Slavic Mythology Art; Slavic mythology, often for Baba Yaga, Domovoi, or pagan festivals
Style name: Smothering Earth_Fantasy; Helpless figure slowly consumed by shovelfuls of dirt
Style name: Social Realism painting; Unflinching witness to hardship and adversity faced by ordinary people, borne with deep empathy yet refusal to romanticize
Style name: Sonnet; Sonnet, often for 14-line poems, iambic pentameter, or Shakespearean sonnets
Style name: Sound Art; often for installations, performances, or auditory experiences
Style name: Sound Sculpture; often for interactive or immersive experiences
Style name: South African Art; South African traditions, often for contemporary expression, apartheid themes, or diverse influences
Style name: South American Textile Art; South American Textile Art, often for woven fabrics, Andean traditions, or colorful patterns
Style name: Southwest Kachina Dolls; Southwest Kachina Dolls, often for carved dolls, Native American beliefs, or Southwest tribes
Style name: Spaghetti Western; Spaghetti Western, often for Italian influence, anti-hero characters, or stylistic violence
Style name: Spanish Art; Spanish traditions, often for Goya, flamenco, or Moorish influences
Style name: Sports Card_Photography_Portraiture; Portrait photo, team uniforms, staged pose, logo, statistics text, trading card design
Style name: Sports Photography; Sports Photography, often for athletic events, dynamic actions, or competitive moments
Style name: Spring Art; Spring, often for blossoms, renewal, or fresh colors
Style name: Stained Glass Art; often in windows, panels, or decorative objects
Style name: Stained Glass_Uncategorized; Colorful glass fragments, lead came details, backlit, translucent, mosaic
Style name: Steampunk Fantasy Art; Steampunk, often for gears, Victorian era, or retrofuturistic technology
Style name: Steampunk; Steampunk, often for steam-powered machinery, Victorian aesthetics, or retrofuturistic designs
Style name: stfhgff_Photography; subject focus,(photograph:13),(Beautiful female:13),AS-Elderly,
Style name: Stone Sculpture; often using chisels, hammers, and other tools
Style name: Stop Motion_Animation; Armatures, clay sculpted character, replacement animation, jerky jittery motion, centered composition
Style name: Streamer Bike_Retro; Ribbons flowing, fun retro ride, vibrant summer vacation
Style name: Street Art and Graffiti; Street Art and Graffiti, often for urban walls, spray painting, or rebellious expression
Style name: Street Art; often using spray paint, stencils, or murals
Style name: Street Photography; Photographing candid moments in public spaces, often capturing urban life and human interactions
Style name: Stuckism Variant_Uncategorized; Reaction against conceptual art, promotes figurative painting and poetic vision
Style name: Stuckism_Uncategorized; Expressive directness and poetic human vision as antidote to ironic postmodernism of establishment artworld
Style name: Studio Ghibli_Fantasy_Surrealism; Watercolor backgrounds, dreamlike wonder, spirited characters, imaginative fantasy worlds
Style name: Studio Portrait Photography; Studio Portrait Photography, often for controlled lighting, professional portraits, or posed subjects
Style name: Sumi-e Painting; Sumi-e Painting, often for ink wash painting, Zen principles, or Asian calligraphy
Style name: Summer Art; Summer, often for beaches, sunshine, or vacation vibes
Style name: Surf Wood Sign_Retro; Ocean vibes, distressed paint, shark silhouette, route marker
Style name: Surrealism Art; Surrealism, often for dream-like imagery, unconscious mind, or fantastical elements
Style name: Surrealism; dreams, and irrationality, often using unexpected juxtapositions
Style name: Surrealist Sculpture; Surrealist Sculpture, often for three-dimensional fantasies, unexpected materials, or symbolic objects
Style name: Symbolism Art; Symbolism, often for allegory, mysticism, or personal interpretation
Style name: Synthetic Cubism; Synthetic Cubism, often for collage techniques, simplified shapes, or reconstructed imagery
Style name: Takashi Murakami; in Superflat Pop, smiling flowers, otaku anime, commercial crossover
Style name: Talavera Pottery; Talavera Pottery, often for glazed ceramics, Spanish influence, or Puebla traditions
Style name: Tamara de Lempicka; in Art Deco elegance, modernist female portraits, luxurious stylization, polished finish
Style name: Tarot Cards_Occult; Dramatic lighting, occult symbols, divination ritual
Style name: Tattoo Print_Retro_Tattoo Art; Vibrant colors, retro flair, snake, nautical star, rose
Style name: Techno Music Visuals; Techno Music Visuals, often for techno beats, club scenes, or electronic dance
Style name: Temporary Art Installations; Creating temporary art installations, often for events, festivals, or time-limited exhibitions
Style name: Terrarium Bottle_Still Life; Layers of sand and charcoal, succulents, found objects
Style name: Teslapunk_Portraiture; Dramatic hairstyle, electrified coils, steampunk and neon vibes
Style name: Textile Art; Creating art with Textile, often for weaving, fabrics, or tactile experiences
Style name: Textile Sculpture; often through weaving, knitting, felting, or stitching
Style name: Thai Art; Thai traditions, often for temple murals, dance drama, or lacquerware
Style name: Thomas Gainsborough; in Informal portraits, sensuous brushwork, rustic vistas, stylish aristocracy
Style name: Tibetan Thangka Painting; Tibetan Thangka Painting, often for Buddhist art, meditation aids, or spiritual practices
Style name: Tiki Mug_Retro; Ornate carvings, tropical motifs, bamboo textures, mysterious cocktail
Style name: Tiki Totem_Sculpture; Stacked carvings, tribal motifs, tropical wood
Style name: Toei_Retro_Animation; Hand-painted cels, exaggerated motion, retro vibes, 60s - 80s era animation
Style name: Traditional Animation; Traditional Animation, often for hand-drawn frames, classic techniques, or fluid movements
Style name: Traditional Pottery; often hand-building or using a pottery wheel
Style name: Tranquil Art; Tranquility, often for calm waters, soft colors, or peaceful scenes
Style name: Transavantgarde Variant_Uncategorized; Exuberant brushwork, mythic archetypes, return to painting and figuration with postmodernist irony
Style name: Transavantgarde_Uncategorized; Exuberant painterly expression, mythic archetypes, returns to painting and figuration with irony in postmodern era
Style name: Transgressive Art Variant_Uncategorized; Shocking irreverent motifs violate social taboos, extreme fringe imagery scorns mainstream sensibilities
Style name: Transgressive Art_Uncategorized; Shocking confrontational motifs violate social taboos, extreme fringe imagery scorns mainstream taste
Style name: Twin Peaks; Twin Peaks, often for mystery, surreal imagery, or David Lynch's creation
Style name: Typography Design; Typography Design, often for typefaces, letterforms, or typographic art
Style name: Ukiyo-e (Japanese Woodblock Printing); Ukiyo-e, often for traditional Japanese woodblock printing, historical subjects, or nature themes
Style name: Ukiyo-e Art; Ukiyo-e Art, often for woodblock prints, Edo period themes, or Japanese aesthetics
Style name: Underwater Photography; Underwater Photography, often for aquatic scenes, marine life, or submerged beauty
Style name: UPA_Comics_Animation; 1950s limited animation, flat graphic style, stylized designs, energetic
Style name: Urban Fantasy Art; Urban Fantasy, often for modern magic, supernatural beings, or cityscapes
Style name: Urban Landscape Photography; Urban Landscape Photography, often for cityscapes, architectural forms, or metropolitan scenes
Style name: Urban Photography; Urban Photography, often for cityscapes, urban environments, or metropolitan energy
Style name: Urban Sculpture; often large-scale and site-specific
Style name: Vaporgram_Retro; Retro internet aesthetic, web 10 nostalgia, cyberpunk tones, neon lighting
Style name: Vaporwave Retro_Sci-Fi_Retro; Grid art, sunsets, neon palms, vibrant nostalgia, retro futuristic
Style name: Vector Portrait_Portraiture; Geometric primitives, solid colors, minimalist shapes, core essence
Style name: Venezuelan Art; Venezuelan traditions, often for kinetic art, landscapes, or indigenous weaving
Style name: Video Art; often for installations, performances, or conceptual works
Style name: Vietnamese Art; Vietnamese traditions, often for silk painting, woodblock prints, or bamboo crafts
Style name: Vija Celmins; in Luminous oceans, starfields, spiderwebs, meticulous paintings
Style name: Vincent Van Gogh; in Explosive color, energetic brushwork, emotionally charged landscapes, perceptive portraits
Style name: Vintage Baseball_Retro_Photography; Black and white photo, retro uniforms, old timey stadium, nostalgic
Style name: Vintage Halloween Costume_Retro; 1960s style Creature from the Black Lagoon monster
Style name: Vintage Halloween Mask_Retro; Distressed burlap, stitched seams, eerie expression
Style name: Vintage Halloween_Retro; Jack-o-lanterns, trick or treaters, creepy costumes, fall leaves
Style name: Vintage Robot Toy_Sci-Fi_Retro; Colorful plastic, lights and buttons, 1950s sci-fi influences
Style name: Vintage Tattoo Flash_Retro_Tattoo Art; Traditional motifs, bright colors, bold outlines, roses, snakes, nautical, old school tattoo artwork
Style name: Vintage Tattoo Print_Retro_Tattoo Art; Sailor Jerry style, nautical themes, retro pin-up, aquatint
Style name: Vintage Travel Poster_Retro_Nature_Landscape; Retro, hand-drawn, destination advertisement, vintage typography, bright vivid colors, stylized landscape
Style name: Virtual Art_Sci-Fi; Full immersion in responsive simulated environments, navigating imaginary spaces through avatars and AI systems
Style name: Virtual Reality Art; often for immersive experiences or virtual environments
Style name: Vogue Cover_Photography_Fashion; Dramatic photography, couture dress, supermodel, avant garde style
Style name: Vorticism_Uncategorized; Angular lines, hard-edged shapes, machine aesthetic, vortex of abstract energy
Style name: Wallace and Gromit; in Claymation style, eccentric characters, dry wit, quintessential British humor
Style name: War Films; War Films, often for battle scenes, military conflicts, or wartime narratives
Style name: Wassily Kandinsky; in Abstract compositions, synesthesia, vibrant color theory, spiritual symbolism
Style name: Water Art; Water, often for oceans, fluidity, or cooling sensations
Style name: Watercolor Painting; often on paper, known for soft washes and transparent effects
Style name: Weaving; often for fabrics, tapestries, or rugs
Style name: Wedding Photography; Wedding Photography, often for bridal captures, romantic scenes, or wedding celebrations
Style name: West African Art; West African traditions, often for masks, textiles, or sculpture
Style name: Wildlife Photography; often in their natural habitats, focusing on behavior and appearance
Style name: William Kentridge; in Charcoal animations, erased histories, melancholic drawings, South African life
Style name: Winter Art; Winter, often for snowflakes, cold landscapes, or holiday cheer
Style name: Wolfgang Tillmans; in Everyday intimacy, casual snapshots, LGBQT club culture, expanding photographic vision
Style name: Wood Carving; ornaments, and decorative objects
Style name: Woodblock Art_Nature; Ukiyo-e style, inky textures, tranquil nature scene
Style name: Woodblock Printing; often in traditional or handcrafted styles
Style name: Woodblock Print_Uncategorized; Ukiyo-e, hand-carved timber block, natural pigments, water-based inks, zen tranquil scene
Style name: Woodcut; often carving images into a block of wood
Style name: Xilam_Comics_Animation; High energy, stylized 2D animation, colorful characters, dynamic action
Style name: Yayoi Kusama; in Polka dot fever, infinity rooms, psychedelic immersion, obsessional pattern
`;

export const STYLES: Style[] = stylesRaw
  .split('\n')
  .map(line => line.trim())
  .filter(line => line.startsWith('Style name:') && line.includes(';'))
  .map(line => {
    // line is "Style name: [NAME]; [PROMPT]"
    const withoutPrefix = line.substring('Style name:'.length).trim();
    const parts = withoutPrefix.split(';');
    const name = parts[0].trim().replace(/[_-]/g, ' ').replace(/\./g, '');
    const prompt = parts.slice(1).join(';').trim().replace(/\./g, '');
    return { name, prompt };
  })
  .filter(style => style.name && style.prompt)
  .sort((a, b) => a.name.localeCompare(b.name));
