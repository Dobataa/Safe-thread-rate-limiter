class RateLimiter{
    maxRequests: number;
    window: number;
    users: Map<string, Map<number, {count: number}>>
    bucketSize: number


    constructor(maxRequests: number, window: number){
        if(maxRequests <= 0){
            throw new Error("Max requests should be positive number");
        }

        if(window <= 0){
            throw new Error("Window should be positive number");
        }
        
        this.maxRequests = maxRequests;
        this.window = window * 1000;

        this.bucketSize = 1000;
        this.users = new Map();
    }

    allowRequest(userId: string): boolean{
        const now = Date.now();
        const currentBucket = Math.floor(now / this.bucketSize);

        if(!this.users.has(userId)){
            this.users.set(userId, new Map());
        }

        const buckets = this.users.get(userId)!;
        const oldestAllowedBucket = currentBucket - Math.floor(this.window / this.bucketSize);

        for(const bucketId of buckets.keys()){
            if(bucketId < oldestAllowedBucket){
                buckets.delete(bucketId);
            }
        }

        let totalRequests = 0;

        for(const bucket of buckets.values()){
            totalRequests += bucket.count;
        }

        if(totalRequests >= this.maxRequests){
            return false;
        }

        if(!buckets.has(currentBucket)){
            buckets.set(currentBucket, { count: 0 });
        }

        buckets.get(currentBucket)!.count++;

        return true;
    }
}