export type ParsedCoursePlan = {
  title:string;
  subtitle:string;
  topics:{title:string;purpose:string;durationMinutes:number;outcomes:string[]}[];
};

export const coursePlanSchema = {type:'object',additionalProperties:false,required:['title','subtitle','topics'],properties:{
  title:{type:'string'},
  subtitle:{type:'string'},
  topics:{type:'array',minItems:1,items:{type:'object',additionalProperties:false,required:['title','purpose','durationMinutes','outcomes'],properties:{title:{type:'string'},purpose:{type:'string'},durationMinutes:{type:'integer'},outcomes:{type:'array',minItems:1,items:{type:'string'}}}}},
}} as const;

const clean=(value:unknown,limit:number)=>typeof value==='string'?value.trim().slice(0,limit):'';

export function parseCoursePlan(value:unknown):ParsedCoursePlan|null{
  if(!value||typeof value!=='object')return null;
  const raw=value as Record<string,unknown>;const title=clean(raw.title,180),subtitle=clean(raw.subtitle,240)||'Professional training material';
  if(!title||!Array.isArray(raw.topics))return null;
  const topics=raw.topics.slice(0,12).flatMap(item=>{if(!item||typeof item!=='object')return[];const topic=item as Record<string,unknown>;const topicTitle=clean(topic.title,120),purpose=clean(topic.purpose,500),durationMinutes=Math.round(Number(topic.durationMinutes));const outcomes=Array.isArray(topic.outcomes)?topic.outcomes.map(item=>clean(item,240)).filter(Boolean).slice(0,4):[];if(!topicTitle||!purpose||!Number.isFinite(durationMinutes)||durationMinutes<5||!outcomes.length)return[];return[{title:topicTitle,purpose,durationMinutes:Math.min(480,durationMinutes),outcomes}];});
  return topics.length>=2?{title,subtitle,topics}:null;
}

export function topicSlideRange(durationMinutes:number){
  const target=Math.max(4,Math.min(16,Math.ceil(durationMinutes/8)));
  return {minimum:Math.max(4,target-1),maximum:Math.min(18,target+1),compactMaximum:Math.max(4,target-2)};
}

export function courseOutcomeSections(plan:ParsedCoursePlan){
  const outcomes=plan.topics.map(topic=>`${topic.title}: ${topic.outcomes[0]}`);
  const sections=[];
  for(let index=0;index<outcomes.length;index+=2){
    const page=Math.floor(index/2)+1;
    sections.push({
      title:`Learning outcomes${outcomes.length>5?` ${page}`:''}`,
      summary:'These approved outcomes define what participants should be able to demonstrate after completing the course and guide the detailed topic materials that follow.',
      bullets:outcomes.slice(index,index+2).map(outcome=>outcome.trim().split(/\s+/).slice(0,24).join(' ')),
      instructionalPurpose:'orient' as const,
      timingMinutes:2,
      facilitatorNotes:['Connect each outcome to a business decision participants will make during the course. Clarify that detailed outcomes and success evidence appear inside the relevant topic deck.'],
      visual:{type:'none' as const,title:'',description:'',sourceName:'',labels:[],values:[]},
      sourceRefs:[] as string[],
    });
  }
  return sections;
}

export function courseAgendaSections(plan:ParsedCoursePlan){
  const agenda=plan.topics.map(topic=>`${topic.durationMinutes} minutes — ${topic.title}`);
  const sections=[];
  for(let index=0;index<agenda.length;index+=4){
    const page=Math.floor(index/4)+1;
    sections.push({
      title:`Timed agenda${agenda.length>4?` ${page}`:''}`,
      summary:'This timed agenda allocates the approved course duration across the sequenced topics, providing facilitators and participants with a practical delivery roadmap.',
      bullets:agenda.slice(index,index+4),
      instructionalPurpose:'orient' as const,
      timingMinutes:2,
      facilitatorNotes:['Confirm the sequence, planned breaks and exercise timing before delivery. Explain how each topic builds toward the final executive action plan.'],
      visual:{type:'none' as const,title:'',description:'',sourceName:'',labels:[],values:[]},
      sourceRefs:[] as string[],
    });
  }
  return sections;
}
