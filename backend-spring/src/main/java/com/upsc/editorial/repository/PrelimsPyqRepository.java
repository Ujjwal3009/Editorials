package com.upsc.editorial.repository;

import com.upsc.editorial.model.PrelimsPyq;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PrelimsPyqRepository extends JpaRepository<PrelimsPyq, Long> {
    List<PrelimsPyq> findBySubjectOrderByYearDesc(String subject);
    List<PrelimsPyq> findTop100ByOrderByYearDesc();
}
