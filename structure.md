This is where the frontend and backend exist, hence why is is called a monorepo. Two different "apps" in the same space
apps/
    /005   admin/ contains admin UI
    /006   api/ this is the backend
    /007   web/ this is the frontend

The purpose of packages/ is to avoid duplicate code and api calls, one source for shared logic. 
(reusable UI, shared logic, shared type, api wrappers)
packages/
    /008   shared/ might not need, not sure. Added it because it is generic but don't know what it is used for 
    /009   types/ contracts or interfaces, for example Sale
    /010   ui/  shared UI components, used by both dashboard and admin
    /011   utils/ pure helper functions, like formatting data, calculations and data transformation, example; format currency. 

package.json <- this is the project root, manager of whole monorepo 
