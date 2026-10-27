-- Pure rules of the actual shared runtime, including preview, wrong choices,
-- free routing, timing and the same shuffled task for every player.
local E=assert(loadfile(EVENT_CORE_PATH))()
for _,game in ipairs({"signal","memory","collect"}) do
 local state=E.New(function(n) return n end,0,game)
 E.Advance(state,0) E.Advance(state,20)
 local total=game=="memory" and 6 or 8
 assert(#state.order==total)
 assert(E.Start(state,1,20) and E.Start(state,2,20))
 assert(state.runs[1].previewUntil==(game=="memory" and 26 or 20))
 if game=="memory" then
  local ok,why=E.Hit(state,1,state.order[1],25,0) assert(not ok and why=="preview" and state.runs[1].step==0)
  local other=state.order[1]%4+1
  ok,why=E.Hit(state,2,other,28,0) assert(not ok and why=="memory" and not state.runs[2])
  assert(not E.Start(state,3,state.deadline-80))
  assert(E.Start(state,3,state.deadline-81))
 end
 local begin=game=="memory" and 26 or 20
 for i=1,total do
  local checkpoint=game=="collect" and ({2,4,1,3})[(i-1)%4+1] or state.order[i]
  local ok,why,time=E.Hit(state,1,checkpoint,begin+i*3,1)
  assert(ok)
  if i==1 and game=="collect" then
   local repeated,reason=E.Hit(state,1,checkpoint,begin+4,1) assert(not repeated and reason=="repeat" and state.runs[1].step==1)
  end
  if i==2 and game=="collect" then local duplicate,reason=E.Hit(state,1,2,begin+7,1) assert(not duplicate and reason=="visited" and state.runs[1].step==2) end
  if i==total then assert(why=="finish" and time==total*3,"preview must not inflate the timed result") end
 end
 assert(not E.Hit(state,1,1,begin+total*3+1,1))
 assert(state.best[1]==total*3)
 E.Advance(state,state.deadline) E.Advance(state,state.deadline)
 assert(next(state.best)==nil and next(state.rewarded)==nil)
end
print("Minigame core: ordered eight, hidden-memory six/preview, free eight/station switching, deadlines, invalid choices and timing passed")
