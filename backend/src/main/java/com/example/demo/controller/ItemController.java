package com.example.demo.controller;
import com.example.demo.model.Item;
import com.example.demo.repository.ItemRepository;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/items")
public class ItemController {

    private final ItemRepository itemRepository;
    private final MongoTemplate mongoTemplate;

    @Autowired
    public ItemController(ItemRepository itemRepository, MongoTemplate mongoTemplate) {
        this.itemRepository = itemRepository;
        this.mongoTemplate = mongoTemplate;
    }

    @GetMapping
    public List<Item> getAllItems(
            @RequestParam(required = false) Double minPrice,
            @RequestParam(required = false) Double maxPrice) {

        Query query = new Query();
        List<Criteria> criteriaList = new ArrayList<>();

        if (minPrice != null && maxPrice != null) {
            criteriaList.add(Criteria.where("price").gte(minPrice).lte(maxPrice));
        } else if (minPrice != null) {
            criteriaList.add(Criteria.where("price").gte(minPrice));
        } else if (maxPrice != null) {
            criteriaList.add(Criteria.where("price").lte(maxPrice));
        }

        if (!criteriaList.isEmpty()) {
            query.addCriteria(new Criteria().andOperator(criteriaList.toArray(new Criteria[0])));
        }

        return mongoTemplate.find(query, Item.class);
    }

    @PostMapping
    public Item addItem(@Valid @RequestBody Item item) {
        return itemRepository.save(item);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteItem(@PathVariable String id) {
        if (!itemRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        itemRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}")
    public ResponseEntity<Item> updateItem(@PathVariable String id, @Valid @RequestBody Item updatedItem) {
        Optional<Item> existingItemOptional = itemRepository.findById(id);

        if (existingItemOptional.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Item existingItem = existingItemOptional.get();
        existingItem.setName(updatedItem.getName());
        existingItem.setDescription(updatedItem.getDescription());
        existingItem.setPrice(updatedItem.getPrice());
        existingItem.setQuantity(updatedItem.getQuantity());

        return ResponseEntity.ok(itemRepository.save(existingItem));
    }
}