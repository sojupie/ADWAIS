To do: choose strategy for endpoints. 
1. Either one massive DTO/Endpoint that combines multiple sub-DTOs into one for simplicity.
2. Or have multiple endpoints to reduce over-fetching. You also don't run the risk of one error making everything else fail.
3. Something in-between
