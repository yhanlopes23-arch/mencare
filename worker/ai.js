/**
 * MENCARE AI endpoint - Cloudflare Worker.
 * Configure OPENAI_API_KEY as a secret in Cloudflare, never in the HTML.
 * Optional env.ALLOWED_ORIGIN: e.g. https://mencare.pages.dev
 */
export default {
  async fetch(request, env) {
    const origin=request.headers.get('Origin')||'';
    const allowed=env.ALLOWED_ORIGIN||'';
    const cors={
      'Access-Control-Allow-Origin': allowed || origin || '*',
      'Access-Control-Allow-Headers':'Content-Type',
      'Access-Control-Allow-Methods':'POST, OPTIONS',
      'Vary':'Origin'
    };
    if(allowed && origin!==allowed) return new Response('Origem não autorizada',{status:403});
    if(request.method==='OPTIONS')return new Response(null,{status:204,headers:cors});
    if(request.method!=='POST')return new Response('Use POST',{status:405,headers:cors});
    if(!env.OPENAI_API_KEY)return Response.json({error:'Configure OPENAI_API_KEY no Worker.'},{status:503,headers:cors});
    try{
      const body=await request.json();
      const allowedRegions=['Rosto','Couro cabeludo','Cabelo','Barba e bigode','Orelhas','Olhos e pálpebras','Lábios','Boca e dentes','Pescoço e nuca','Ombros, costas e peito','Axilas','Braços e cotovelos','Mãos e unhas','Abdômen','Virilha e área íntima externa','Glúteos','Pernas e joelhos','Pés e calcanhares'];
      const profile=body.profile||{};
      const choose=(key,options,defaultValue)=>options.includes(profile[key])?profile[key]:defaultValue;
      const safe={
        skin:choose('skin',['normal','oleosa','seca','mista','sensivel'],'normal'),
        hair:choose('hair',['liso','ondulado','cacheado','crespo','raspado'],'liso'),
        beard:choose('beard',['sim','nao'],'nao'),
        goal:choose('goal',['basico','oleosidade','ressecamento','aparencia'],'basico'),
        budget:choose('budget',['economico','medio','livre'],'economico'),
        region:allowedRegions.includes(body.region)?body.region:'Rosto'
      };
      const upstream=await fetch('https://api.openai.com/v1/chat/completions',{
        method:'POST',
        headers:{'Authorization':'Bearer '+env.OPENAI_API_KEY,'Content-Type':'application/json'},
        body:JSON.stringify({
          model:env.OPENAI_MODEL||'gpt-4o-mini',
          temperature:0.3,
          response_format:{type:'json_object'},
          messages:[
            {role:'system',content:'Você é um guia conservador de autocuidado masculino. Responda em português brasileiro APENAS JSON com a chave suggestions, array de 5 a 8 objetos contendo area, product, reason (strings curtas). Sugira categorias de produtos e ingredientes, não invente marcas, eficácia garantida ou preços. Priorize a região indicada sem ignorar cuidados essenciais. Evite recomendações médicas, medicamentos, diagnósticos, procedimentos invasivos e produtos irritantes para a região íntima. Inclua proteção solar FPS 30+ quando pertinente. Considere pele sensível e orçamento.'},
            {role:'user',content:JSON.stringify(safe)}
          ]
        })
      });
      if(!upstream.ok) return Response.json({error:'Falha no provedor de IA'},{status:502,headers:cors});
      const raw=await upstream.json();
      const obj=JSON.parse(raw.choices?.[0]?.message?.content||'{}');
      if(!Array.isArray(obj.suggestions))throw Error('Formato inesperado');
      return Response.json({suggestions:obj.suggestions.slice(0,12).map(x=>({area:String(x.area||''),product:String(x.product||''),reason:String(x.reason||'')}))},{headers:cors});
    }catch(err){
      return Response.json({error:'Não foi possível gerar sugestões'},{status:400,headers:cors});
    }
  }
};
