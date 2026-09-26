import type { AdvancedDocument } from '../../../lib/job-generation';

export function relevantSourceExcerpt(content:string,terms:Set<string>,limit=7000){
  const blocks=content.split(/\n{2,}|(?<=[.!?])\s+(?=[A-Z0-9])/).map((text,index)=>({text:text.trim(),index})).filter(item=>item.text.length>40);
  const ranked=blocks.map(item=>({...item,score:[...terms].reduce((score,term)=>score+(item.text.toLowerCase().includes(term)?1:0),0)})).sort((a,b)=>b.score-a.score||a.index-b.index).slice(0,18).sort((a,b)=>a.index-b.index);
  const excerpt=ranked.map(item=>item.text).join('\n\n').slice(0,limit);
  return excerpt||content.slice(0,limit);
}

export function validateTrainingTopicQuality(document:AdvancedDocument,topic:{title:string;durationMinutes:number},visuals:boolean){
  const visibleTiming=/\b\d+(?:\.\d+)?\s*(?:[-–—]\s*)?(?:minutes?|mins?|hours?|hrs?)\b/i;
  if(visibleTiming.test(document.title)||visibleTiming.test(document.subtitle)||document.sections.some(section=>visibleTiming.test(section.title)))return `${topic.title} must keep duration out of visible presentation headings; store timing only in structured metadata and facilitator notes.`;
  const purposes=new Set(document.sections.map(section=>section.instructionalPurpose));
  if(purposes.size<3||!purposes.has('demonstrate')||![...purposes].some(purpose=>purpose==='apply'||purpose==='decide'))return `${topic.title} needs a stronger adult-learning story arc with explanation, demonstration and application or decision-making.`;
  const weakNotes=document.sections.filter(section=>section.facilitatorNotes.join(' ').trim().split(/\s+/).filter(Boolean).length<18);
  if(weakNotes.length)return `${topic.title} needs substantive facilitator notes with teaching guidance, a prompt and a transition for every slide.`;
  const allocated=document.sections.reduce((total,section)=>total+section.timingMinutes,0);
  if(allocated<topic.durationMinutes*.65||allocated>topic.durationMinutes*1.15)return `${topic.title} slide timings must form a realistic teaching sequence for its ${topic.durationMinutes}-minute allocation.`;
  const generic=/\b(?:unlock potential|rapidly evolving|game[- ]changer|transformative journey|key takeaway|in today'?s world|leverage synergies|drive innovation|best[- ]in[- ]class)\b/i;
  if(document.sections.some(section=>generic.test(`${section.title} ${section.summary} ${section.bullets.join(' ')}`)))return `${topic.title} contains generic or promotional filler instead of expert training content.`;
  if(visuals){const developed=document.sections.filter(section=>['chart','process','comparison','timeline','matrix','cycle','architecture','risk-map'].includes(section.visual.type));if(developed.length<Math.max(2,Math.ceil(document.sections.length/2)))return `${topic.title} needs more knowledge-derived editable visuals with an executive presentation standard.`;if(developed.length>=3&&new Set(developed.map(section=>section.visual.type)).size<2)return `${topic.title} needs more than one visual form.`;}
  return '';
}

export function hasStructuredCoreSequence(document:AdvancedDocument){
  if(!document.trainingModules?.length)return false;
  return document.trainingModules.every(module=>{
    const purposes=new Set(module.sections.map(section=>section.instructionalPurpose));
    return module.sections.length>=4&&purposes.has('demonstrate')&&[...purposes].some(purpose=>purpose==='apply'||purpose==='decide');
  });
}
